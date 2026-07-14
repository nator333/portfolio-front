// Values come from the `PortfolioApiStack-prod` outputs after `npm run deploy:prod` in portfolio-api.
export const environment = {
  production: true,
  apiBaseUrl: 'https://REPLACE_WITH_PROD_API_ID.execute-api.us-west-1.amazonaws.com',
  cognitoRegion: 'us-west-1',
  cognitoUserPoolId: 'REPLACE_WITH_PROD_USER_POOL_ID',
  cognitoClientId: 'REPLACE_WITH_PROD_USER_POOL_CLIENT_ID',
};
