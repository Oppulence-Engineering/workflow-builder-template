export const blobUploadCodegenTemplate = `
// Upload to Azure Blob Storage
const {{nodeId}}Content = {{content}};
const {{nodeId}}BlockBlobClient = containerClient.getBlockBlobClient("{{blobName}}");
await {{nodeId}}BlockBlobClient.upload({{nodeId}}Content, Buffer.byteLength({{nodeId}}Content));
`.trim();
