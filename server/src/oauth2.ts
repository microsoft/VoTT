import * as express from 'express';
import * as simple_oauth2 from 'simple-oauth2';
import * as config from './config';

export const oauth2 = simple_oauth2.create({
  client: {
    id: config.creds.clientID,
    secret: config.creds.clientSecret,
  },
  auth: {
    tokenHost: 'https://login.microsoftonline.com/common',
    authorizePath: '/oauth2/v2.0/authorize',
    tokenPath: '/oauth2/v2.0/token',
  },
});

export interface Token {
  refresh_token: string;
  access_token?: string;
  expires_at?: string | Date;
}

export function client(token: Token) {
  token.expires_at = token.expires_at || new Date(0);
  const result = oauth2.accessToken.create(token);
  return result;
}
