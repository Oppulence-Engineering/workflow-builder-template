export const listLeadsCodegenTemplate = `
// List Leads - Search and filter existing leads
const {{nodeId}}Result = await leadScraper.listLeads({
  searchQuery: "{{searchQuery}}",
  city: "{{city}}",
  state: "{{state}}",
  country: "{{country}}",
  minGoogleRating: {{minGoogleRating}},
  maxGoogleRating: {{maxGoogleRating}},
  minReviewCount: {{minReviewCount}},
  requireEmail: {{requireEmail}},
  requirePhone: {{requirePhone}},
  requireWebsite: {{requireWebsite}},
  pageSize: {{pageSize}},
  pageNumber: {{pageNumber}},
  sortField: "{{sortField}}",
  sortDirection: "{{sortDirection}}",
});
`.trim();
