// Values come from the `PortfolioApiStack-dev` outputs after `npm run deploy:dev` in portfolio-api.
// The REST API URL includes the stage path (e.g. https://xxx.execute-api.us-west-1.amazonaws.com/dev).
// apiKey identifies the site to the gateway's usage plan (100 req/month cap); fetch its value with:
//   aws apigateway get-api-key --include-value --api-key <ApiKeyId output>
export const environment = {
  production: false,
  apiBaseUrl: 'https://REPLACE_WITH_DEV_API_ID.execute-api.us-west-1.amazonaws.com/dev',
  apiKey: 'REPLACE_WITH_DEV_API_KEY_VALUE',
  cognitoRegion: 'us-west-1',
  cognitoUserPoolId: 'REPLACE_WITH_DEV_USER_POOL_ID',
  cognitoClientId: 'REPLACE_WITH_DEV_USER_POOL_CLIENT_ID',
};
