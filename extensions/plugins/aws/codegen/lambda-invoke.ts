export const lambdaInvokeCodegenTemplate = `
// Lambda Invoke - Call AWS Lambda function
const {{nodeId}}Result = await lambdaInvoke({
  functionName: "{{functionName}}",
  payload: {{payload}},
  invocationType: "{{invocationType}}",
});
`.trim();
