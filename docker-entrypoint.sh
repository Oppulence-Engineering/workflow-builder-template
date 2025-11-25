#!/bin/sh
set -e

# -----------------------------------------------------------------------------
# Docker Entrypoint Script for Workflow Builder
# -----------------------------------------------------------------------------
# This script handles:
# 1. Waiting for PostgreSQL to be ready
# 2. Waiting for Valkey/Redis to be ready (if configured)
# 3. Running database migrations automatically
# 4. Starting the application in the appropriate mode (dev/prod)
# -----------------------------------------------------------------------------

# Color codes for logging
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo "${RED}[ERROR]${NC} $1"
}

# -----------------------------------------------------------------------------
# Wait for PostgreSQL to be ready
# Uses DATABASE_URL environment variable to extract connection details
# -----------------------------------------------------------------------------
wait_for_postgres() {
    if [ -z "$DATABASE_URL" ]; then
        log_warn "DATABASE_URL not set, skipping PostgreSQL wait"
        return 0
    fi

    log_info "Waiting for PostgreSQL to be ready..."
    
    # Extract host and port from DATABASE_URL
    # Format: postgresql://user:password@host:port/database
    DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    
    # Default port if not specified
    DB_PORT=${DB_PORT:-5432}
    
    # Wait for PostgreSQL to accept connections
    max_attempts=30
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
            log_info "PostgreSQL is ready at $DB_HOST:$DB_PORT"
            return 0
        fi
        
        log_info "Waiting for PostgreSQL... (attempt $attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log_error "PostgreSQL did not become ready in time"
    return 1
}

# -----------------------------------------------------------------------------
# Wait for Valkey/Redis to be ready
# Uses PLT_VALKEY_HOST environment variable for connection
# -----------------------------------------------------------------------------
wait_for_valkey() {
    if [ -z "$PLT_VALKEY_HOST" ]; then
        log_warn "PLT_VALKEY_HOST not set, skipping Valkey wait"
        return 0
    fi

    log_info "Waiting for Valkey to be ready..."
    
    # Extract host and port from PLT_VALKEY_HOST
    # Format can be: host, host:port, or redis://host:port
    VALKEY_HOST=$(echo "$PLT_VALKEY_HOST" | sed 's|redis://||' | sed 's|valkey://||' | cut -d: -f1)
    VALKEY_PORT=$(echo "$PLT_VALKEY_HOST" | sed 's|redis://||' | sed 's|valkey://||' | cut -d: -f2 -s)
    
    # Default port if not specified
    VALKEY_PORT=${VALKEY_PORT:-6379}
    
    # Wait for Valkey to accept connections
    max_attempts=30
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if nc -z "$VALKEY_HOST" "$VALKEY_PORT" 2>/dev/null; then
            log_info "Valkey is ready at $VALKEY_HOST:$VALKEY_PORT"
            return 0
        fi
        
        log_info "Waiting for Valkey... (attempt $attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log_error "Valkey did not become ready in time"
    return 1
}

# -----------------------------------------------------------------------------
# Run database migrations
# Uses Drizzle ORM's db:push command to apply schema changes
# -----------------------------------------------------------------------------
run_migrations() {
    if [ -z "$DATABASE_URL" ]; then
        log_warn "DATABASE_URL not set, skipping migrations"
        return 0
    fi

    log_info "Running database migrations..."
    
    if pnpm db:push; then
        log_info "Database migrations completed successfully"
        return 0
    else
        log_error "Database migrations failed"
        return 1
    fi
}

# -----------------------------------------------------------------------------
# Handle graceful shutdown
# Ensures clean termination of the application
# -----------------------------------------------------------------------------
handle_shutdown() {
    log_info "Received shutdown signal, gracefully terminating..."
    kill -TERM "$child_pid" 2>/dev/null
    wait "$child_pid"
    exit 0
}

# Set up signal handlers for graceful shutdown
trap handle_shutdown SIGTERM SIGINT

# -----------------------------------------------------------------------------
# Main execution flow
# -----------------------------------------------------------------------------
main() {
    log_info "Starting Workflow Builder..."
    log_info "Environment: ${NODE_ENV:-development}"
    
    # Wait for dependent services
    wait_for_postgres
    wait_for_valkey
    
    # Run migrations if not explicitly disabled
    if [ "$SKIP_MIGRATIONS" != "true" ]; then
        run_migrations
    else
        log_info "Skipping migrations (SKIP_MIGRATIONS=true)"
    fi
    
    # Execute the main command
    log_info "Starting application..."
    
    # Run the command passed to the entrypoint
    exec "$@" &
    child_pid=$!
    
    # Wait for the child process
    wait "$child_pid"
}

# Run main function with all arguments
main "$@"

