// Values come from the `PortfolioApiStack-prod` outputs after `npm run deploy:prod` in portfolio-api.
// The REST API URL includes the stage path (e.g. https://xxx.execute-api.us-west-1.amazonaws.com/prod).
// apiKey identifies the site to the gateway's usage plan (100 req/month cap); fetch its value with:
//   aws apigateway get-api-key --include-value --api-key <ApiKeyId output>
export const environment = {
  production: true,
  apiBaseUrl: 'https://01vnw2jt67.execute-api.us-west-1.amazonaws.com/prod',
  apiKey: 'OmHyN4U0o01qsH9SqK1rU3Vf4h5YzIHB8DUc6cAR',
  cognitoDomain: 'https://nakamata-cv-prod.auth.us-west-1.amazoncognito.com',
  cognitoClientId: '2qdrj1sit5e7il0fdse7fcjmt9',
};
