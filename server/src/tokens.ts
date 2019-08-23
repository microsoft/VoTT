import * as express from 'express';

export async function getAccessToken(req: express.Request) {
  let user: any = req.get('user');
  if (req.user) {
    // Get the stored token
    var storedToken = user.oauthToken;

    if (storedToken) {
      if (storedToken.expired()) {
        // refresh token
        var newToken = await storedToken.refresh();

        // Update stored token
        user.oauthToken = newToken;
        return newToken.token.access_token;
      }

      // Token still valid, just return it
      return storedToken.token.access_token;
    }
  }
}
