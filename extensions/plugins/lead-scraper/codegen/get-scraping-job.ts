export const getScrapingJobCodegenTemplate = `
// Get Scraping Job - Check status and retrieve results
const {{nodeId}}Result = await leadScraper.getScrapingJob({
  jobId: "{{jobId}}",
});
`.trim();
