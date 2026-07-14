// Values come from the `PortfolioApiStack-dev` outputs after `npm run deploy:dev` in portfolio-api.
export const environment = {
  production: false,
  apiBaseUrl: 'https://REPLACE_WITH_DEV_API_ID.execute-api.us-west-1.amazonaws.com',
  cognitoRegion: 'us-west-1',
  cognitoUserPoolId: 'REPLACE_WITH_DEV_USER_POOL_ID',
  cognitoClientId: 'REPLACE_WITH_DEV_USER_POOL_CLIENT_ID',
};
