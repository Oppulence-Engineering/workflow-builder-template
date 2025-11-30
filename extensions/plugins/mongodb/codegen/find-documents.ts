export const findDocumentsCodegenTemplate = `
// Find documents from MongoDB collection
const {{nodeId}}Result = await db.collection("{{collection}}").find({{filter}}).limit({{limit}}).toArray();
`.trim();
