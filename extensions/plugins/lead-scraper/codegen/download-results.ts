export const downloadResultsCodegenTemplate = `
// Download Results - Export scraping job results
const {{nodeId}}Result = await leadScraper.downloadScrapingResults({
  jobId: "{{jobId}}",
});
`.trim();
