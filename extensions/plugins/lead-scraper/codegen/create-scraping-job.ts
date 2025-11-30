export const createScrapingJobCodegenTemplate = `
// Create Lead Scraping Job - Start a new Google Maps scraping job
const {{nodeId}}Result = await leadScraper.createScrapingJob({
  name: "{{name}}",
  keywords: "{{keywords}}",
  lang: "{{lang}}",
  lat: "{{lat}}",
  lon: "{{lon}}",
  radius: {{radius}},
  email: {{email}},
  fastMode: {{fastMode}},
});
`.trim();
