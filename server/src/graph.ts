import * as graphClient from '@microsoft/microsoft-graph-client';

export async function user(access_token: string) {
  const token = client(access_token);
  const result = await token.api('/me').get();
  return result;
}

export async function getEvents(access_token: string) {
  const token = client(access_token);

  const events = await token.api('/me/events')
    .select('subject,organizer,start,end')
    .orderby('createdDateTime DESC')
    .get();
  return events;
}

export function client(access_token: string): graphClient.Client {
  // Initialize Graph client
  const result = graphClient.Client.init({
    // Use the provided access token to authenticate
    // requests
    authProvider: (done: (err: any, access_token: string) => void) => {
      done(null, access_token);
    },
  });

  return result;
}
