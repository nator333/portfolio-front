// Values come from the `PortfolioApiStack-dev` outputs after `npm run deploy:dev` in portfolio-api.
// The REST API URL includes the stage path (e.g. https://xxx.execute-api.us-west-1.amazonaws.com/dev).
// apiKey identifies the site to the gateway's usage plan (100 req/month cap); fetch its value with:
//   aws apigateway get-api-key --include-value --api-key <ApiKeyId output>
import { firebaseConfig } from './firebase.config';

export const environment = {
  production: false,
  firebase: firebaseConfig,
  // Keep dev traffic out of Analytics; prod build enables it via environment.prod.ts.
  analyticsEnabled: false,
  apiBaseUrl: 'https://ok1kkskdy2.execute-api.us-west-1.amazonaws.com/dev',
  apiKey: 'ALHgc7ND7S3S49ToIyC1eaZARblavmFP4VSFI3Rv',
  // Chat has its own key + usage plan (500 req/month); fetch with the ChatApiKeyId output.
  chatApiKey: 'Fug9rKYn3594hps8O8H1B7Gbnrj4YPc85tFfcPP1',
  cognitoDomain: 'https://nakamata-cv-dev.auth.us-west-1.amazoncognito.com',
  cognitoClientId: '112nreirub0suduqr1kqj34npf',
};
