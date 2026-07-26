// Values come from the `PortfolioApiStack-prod` outputs after `npm run deploy:prod` in portfolio-api.
// The REST API URL includes the stage path (e.g. https://xxx.execute-api.us-west-1.amazonaws.com/prod).
// apiKey identifies the site to the gateway's usage plan (monthly cap set in portfolio-api); fetch its value with:
//   aws apigateway get-api-key --include-value --api-key <ApiKeyId output>

export const environment = {
  production: true,
  apiBaseUrl: 'https://01vnw2jt67.execute-api.us-west-1.amazonaws.com/prod',
  apiKey: 'OmHyN4U0o01qsH9SqK1rU3Vf4h5YzIHB8DUc6cAR',
  // Chat has its own key + usage plan (500 req/month); fetch with the ChatApiKeyId output.
  chatApiKey: 'ICz30MNs6S7xjk0quiZGP4aUlQyxtLex6ve9uNeO',
  // Workout has its own key + daily usage plan; fetch with the WorkoutApiKeyId output.
  workoutApiKey: '5zHdXJC0eKvMVkFjwbXg22UHGS4wTGW3mTBIO3Zh',
  cognitoDomain: 'https://nakamata-cv-prod.auth.us-west-1.amazoncognito.com',
  cognitoClientId: '2qdrj1sit5e7il0fdse7fcjmt9',
  // TODO: fill from the PortfolioApiStack-prod `MediaCdnBaseUrl` output once the
  // media PR (portfolio-api#26) is merged and deployed to prod. Empty until then
  // so a premature prod build cannot point uploads at a distribution that has
  // no images behind it.
  assetCdnBaseUrl: '',
};
