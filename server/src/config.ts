// tslint:disable-next-line: no-var-requires
require('dotenv').config();

export const baseUrl = process.env.BASE_URL || 'http://localhost:3000/';
export const redirectPath = 'auth/openid/return';
export const port = process.env.PORT || '3000';
export const loggingLevel = process.env.LOGGING_LEVEL || 'info';
export const httpLogFormat = process.env.HTTP_LOG_FORMAT || 'dev';

console.log('config values', process.env.APP_ID, process.env.APP_SECRET, baseUrl, redirectPath, port, loggingLevel, httpLogFormat);

export const creds = {
  // Required
  identityMetadata: 'https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration',
  // 'https://login.microsoftonline.com/<tenant_name>.onmicrosoft.com/v2.0/.well-known/openid-configuration',
  // or equivalently: 'https://login.microsoftonline.com/<tenant_guid>/v2.0/.well-known/openid-configuration'
  //
  // or you can use the common endpoint
  // 'https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration'
  // To use the common endpoint, you have to either turn `validateIssuer` off, or provide the `issuer` value.

  // Required, the client ID of your app in AAD
  clientID: process.env.APP_ID,

  // Required, must be 'code', 'code id_token', 'id_token code' or 'id_token'
  // If you want to get access_token, you must use 'code', 'code id_token' or 'id_token code'
  responseType: 'code id_token',

  // Required
  responseMode: 'form_post',

  // Required, the reply URL registered in AAD for your app
  redirectUrl: baseUrl + redirectPath,

  // Required if we use http for redirectUrl
  allowHttpForRedirectUrl: process.env.ALLOW_HTTP ? process.env.ALLOW_HTTP === 'true' : true,

  // Required if `responseType` is 'code', 'id_token code' or 'code id_token'.
  // If app key contains '\', replace it with '\\'.
  clientSecret: process.env.APP_SECRET,

  // Required to set to false if you don't want to validate issuer
  validateIssuer: false,

  // Required if you want to provide the issuer(s) you want to validate instead of using the issuer from metadata
  // issuer could be a string or an array of strings of the following form: 'https://sts.windows.net/<tenant_guid>/v2.0'
  issuer: null as string,

  // !Bug - must be false in this sample
  // Required to set to true if the `verify` function has 'req' as the first parameter
  passReqToCallback: true,

  // Recommended to set to true. By default we save state in express session, if this option is set to true, then
  // we encrypt state and save it in cookie instead. This option together with { session: false } allows your app
  // to be completely express session free.
  useCookieInsteadOfSession: true,

  logLevel: loggingLevel,

  // Required if `useCookieInsteadOfSession` is set to true. You can provide multiple set of key/iv pairs for key
  // rollover purpose. We always use the first set of key/iv pair to encrypt cookie, but we will try every set of
  // key/iv pair to decrypt cookie. Key can be any string of length 32, and iv can be any string of length 12.
  cookieEncryptionKeys: (process.env.COOKIES_SECRETS ? JSON.parse(process.env.COOKIES_SECRETS) :
    [
      { key: '12345678901234567890123456789012', iv: '123456789012' },
      { key: 'abcdefghijklmnopqrstuvwxyzabcdef', iv: 'abcdefghijkl' },
    ]) as Array<{ key: string; iv: string; }>,

  // The additional scopes we want besides 'openid'.
  // 'profile' scope is required, the rest scopes are optional.
  // (1) if you want to receive refresh_token, use 'offline_access' scope
  // (2) if you want to get access_token for graph api, use the graph api url like 'https://graph.microsoft.com/mail.read'
  scope: ['profile', /* 'offline_access', */ 'https://graph.microsoft.com/user.readwrite'],

  // Optional. The lifetime of nonce in session or cookie, the default value is 3600 (seconds).
  nonceLifetime: null as number,

  // Optional. The max amount of nonce saved in session or cookie, the default value is 10.
  nonceMaxAmount: 5,

  // Optional. The clock skew allowed in token validation, the default value is 300 seconds.
  clockSkew: null as number,

  // Optional.  Is B2C
  isB2C: false,
};

// The url you need to go to destroy the session with AAD
export let destroySessionUrl = 'https://login.microsoftonline.com/common/oauth2/logout?post_logout_redirect_uri=http://localhost:3000';

if (!creds.clientID || !creds.clientSecret) {
  console.log('issue with config');
  throw Error('Missing configuration. You need a .env file or environment variables for APP_ID and APP_SECRET');
}
