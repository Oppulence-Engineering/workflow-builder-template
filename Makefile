# =============================================================================
# Workflow Builder - Makefile
# =============================================================================
# Common commands for development and deployment
# =============================================================================

.PHONY: help dev prod down logs clean build install db-push db-generate db-studio test fix type-check

# Default target
help:
	@echo "Workflow Builder - Available Commands"
	@echo "======================================"
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Start development environment (Docker Compose)"
	@echo "  make dev-local    - Start local development (pnpm dev)"
	@echo "  make install      - Install dependencies"
	@echo ""
	@echo "Production:"
	@echo "  make prod         - Start production environment (Docker Compose)"
	@echo "  make build        - Build the application"
	@echo ""
	@echo "Docker:"
	@echo "  make down         - Stop all containers"
	@echo "  make logs         - Follow container logs"
	@echo "  make clean        - Stop containers and remove volumes"
	@echo "  make restart      - Restart all containers"
	@echo ""
	@echo "Database:"
	@echo "  make db-push      - Push schema changes to database"
	@echo "  make db-generate  - Generate database migrations"
	@echo "  make db-studio    - Open Drizzle Studio"
	@echo ""
	@echo "Code Quality:"
	@echo "  make fix          - Fix linting and formatting issues"
	@echo "  make type-check   - Run TypeScript type checking"
	@echo "  make check        - Run all checks (type-check + lint)"
	@echo ""

# =============================================================================
# Development
# =============================================================================

# Start development environment with Docker Compose
dev:
	@echo "Starting development environment..."
	docker-compose --env-file .env.local up

# Start development environment in detached mode
dev-d:
	@echo "Starting development environment (detached)..."
	docker-compose --env-file .env.local up -d

# Start local development (without Docker)
dev-local:
	@echo "Starting local development server on port 8000..."
	pnpm dev

# Install dependencies
install:
	@echo "Installing dependencies..."
	pnpm install

# =============================================================================
# Production
# =============================================================================

# Start production environment with Docker Compose
prod:
	@echo "Starting production environment..."
	docker-compose --env-file .env.local -f docker-compose.prod.yml up

# Start production environment in detached mode
prod-d:
	@echo "Starting production environment (detached)..."
	docker-compose --env-file .env.local -f docker-compose.prod.yml up -d

# Build the application
build:
	@echo "Building application..."
	pnpm build

# =============================================================================
# Docker Management
# =============================================================================

# Stop all containers
down:
	@echo "Stopping containers..."
	docker-compose --env-file .env.local down

# Stop production containers
down-prod:
	@echo "Stopping production containers..."
	docker-compose --env-file .env.local -f docker-compose.prod.yml down

# Follow container logs
logs:
	@echo "Following container logs..."
	docker-compose --env-file .env.local logs -f

# Follow specific service logs
logs-app:
	docker-compose --env-file .env.local logs -f app

logs-db:
	docker-compose --env-file .env.local logs -f postgres

logs-redis:
	docker-compose --env-file .env.local logs -f valkey

# Stop containers and remove volumes (clean slate)
clean:
	@echo "Stopping containers and removing volumes..."
	docker-compose --env-file .env.local down -v --remove-orphans

# Restart all containers
restart: down dev

# Restart in detached mode
restart-d: down dev-d

# =============================================================================
# Database
# =============================================================================

# Push schema changes to database
db-push:
	@echo "Pushing schema to database..."
	pnpm db:push

# Generate database migrations
db-generate:
	@echo "Generating database migrations..."
	pnpm db:generate

# Open Drizzle Studio
db-studio:
	@echo "Opening Drizzle Studio..."
	pnpm db:studio

# Run database migrations
db-migrate:
	@echo "Running database migrations..."
	pnpm db:migrate

# =============================================================================
# Code Quality
# =============================================================================

# Fix linting and formatting issues
fix:
	@echo "Fixing linting and formatting issues..."
	pnpm fix

# Run TypeScript type checking
type-check:
	@echo "Running type check..."
	pnpm type-check

# Run all checks
check: type-check
	@echo "Running lint check..."
	pnpm check

# =============================================================================
# Helm / Kubernetes
# =============================================================================

# Template Helm chart (dry-run)
helm-template:
	@echo "Templating Helm chart..."
	helm template workflow-builder k8s/charts/workflow-builder

# Install Helm chart
helm-install:
	@echo "Installing Helm chart..."
	helm install workflow-builder k8s/charts/workflow-builder

# Upgrade Helm chart
helm-upgrade:
	@echo "Upgrading Helm chart..."
	helm upgrade workflow-builder k8s/charts/workflow-builder

# Uninstall Helm chart
helm-uninstall:
	@echo "Uninstalling Helm chart..."
	helm uninstall workflow-builder

# =============================================================================
# Utilities
# =============================================================================

# Generate secrets for .env.local
generate-secrets:
	@echo "Generating secrets..."
	@echo "BETTER_AUTH_SECRET=$$(openssl rand -base64 32)"
	@echo "INTEGRATION_ENCRYPTION_KEY=$$(openssl rand -hex 32)"

# Show running containers
ps:
	docker-compose --env-file .env.local ps

# Shell into the app container
shell:
	docker-compose --env-file .env.local exec app sh

# Check container health
health:
	@echo "Checking container health..."
	@curl -s http://localhost:8000/ > /dev/null && echo "App: healthy" || echo "App: unhealthy"

