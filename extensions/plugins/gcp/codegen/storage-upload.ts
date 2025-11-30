export const storageUploadCodegenTemplate = `
// Upload to Google Cloud Storage
const {{nodeId}}File = storage.bucket("{{bucket}}").file("{{path}}");
await {{nodeId}}File.save({{content}}, { contentType: "{{contentType}}" });
`.trim();
