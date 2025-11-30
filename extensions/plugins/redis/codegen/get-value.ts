export const getValueCodegenTemplate = `
// Get value from Redis
const {{nodeId}}Result = await redis.get("{{key}}");
`.trim();
