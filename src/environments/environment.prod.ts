// Values come from the `PortfolioApiStack-prod` outputs after `npm run deploy:prod` in portfolio-api.
// The REST API URL includes the stage path (e.g. https://xxx.execute-api.us-west-1.amazonaws.com/prod).
// apiKey identifies the site to the gateway's usage plan (100 req/month cap); fetch its value with:
//   aws apigateway get-api-key --include-value --api-key <ApiKeyId output>
export const environment = {
  production: true,
  apiBaseUrl: 'https://REPLACE_WITH_PROD_API_ID.execute-api.us-west-1.amazonaws.com/prod',
  apiKey: 'REPLACE_WITH_PROD_API_KEY_VALUE',
  cognitoRegion: 'us-west-1',
  cognitoUserPoolId: 'REPLACE_WITH_PROD_USER_POOL_ID',
  cognitoClientId: 'REPLACE_WITH_PROD_USER_POOL_CLIENT_ID',
};
