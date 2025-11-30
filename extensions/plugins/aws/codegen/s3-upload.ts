export const s3UploadCodegenTemplate = `
// S3 Upload - Upload file to Amazon S3
const {{nodeId}}Result = await s3Upload({
  bucket: "{{bucket}}",
  key: "{{key}}",
  content: {{content}},
  contentType: "{{contentType}}",
});
`.trim();
