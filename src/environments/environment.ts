// Values come from the `PortfolioApiStack-dev` outputs after `npm run deploy:dev` in portfolio-api.
// The REST API URL includes the stage path (e.g. https://xxx.execute-api.us-west-1.amazonaws.com/dev).
// apiKey identifies the site to the gateway's usage plan (monthly cap set in portfolio-api); fetch its value with:
//   aws apigateway get-api-key --include-value --api-key <ApiKeyId output>

export const environment = {
  production: false,
  apiBaseUrl: 'https://ok1kkskdy2.execute-api.us-west-1.amazonaws.com/dev',
  apiKey: 'ALHgc7ND7S3S49ToIyC1eaZARblavmFP4VSFI3Rv',
  // Chat has its own key + usage plan (500 req/month); fetch with the ChatApiKeyId output.
  chatApiKey: 'Fug9rKYn3594hps8O8H1B7Gbnrj4YPc85tFfcPP1',
  // Workout has its own key + daily usage plan; fetch with the WorkoutApiKeyId output.
  workoutApiKey: 'acGEs0Wtpx5ED7mAr1sU15blIVSEuSxm43Z8bK3h',
  cognitoDomain: 'https://nakamata-cv-dev.auth.us-west-1.amazoncognito.com',
  cognitoClientId: '112nreirub0suduqr1kqj34npf',
  // CloudFront base URL for uploaded images; from the MediaCdnBaseUrl output.
  // Uploaded images resolve to `<base>/<assetId>/w1600.webp` (and thumb.webp).
  assetCdnBaseUrl: 'https://d1f0vrj5w1sbko.cloudfront.net',
};
