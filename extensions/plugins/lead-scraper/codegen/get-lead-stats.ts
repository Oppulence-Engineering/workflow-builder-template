export const getLeadStatsCodegenTemplate = `
// Get Lead Stats - Get aggregate statistics about leads
const {{nodeId}}Result = await leadScraper.getLeadStats({
  timeRange: "{{timeRange}}",
  city: "{{city}}",
  state: "{{state}}",
  country: "{{country}}",
});
`.trim();
