import * as bodyParser from 'body-parser';
import * as morgan from 'morgan';
import * as bunyan from 'bunyan';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import cookieSession = require('cookie-session');
import * as methodOverride from 'method-override';
import * as passport from 'passport';
import * as passportAzureAD from 'passport-azure-ad';
import * as config from './config';
import * as path from 'path';
import * as express_request_id from 'express-request-id';
import * as simple_oath2 from 'simple-oauth2';
import * as graph from './graph';
import * as tokens from './tokens';

const OIDCStrategyTemplate = {} as passportAzureAD.IOIDCStrategyOptionWithoutRequest;

const log = bunyan.createLogger({
  name: 'BUNYAN-LOGGER',
  src: true,
});

/******************************************************************************
 * Set up passport in the app
 ******************************************************************************/

// -----------------------------------------------------------------------------
// To support persistent login sessions, Passport needs to be able to
// serialize users into and deserialize users out of the session.  Typically,
// this will be as simple as storing the user ID when serializing, and finding
// the user by ID when deserializing.
// -----------------------------------------------------------------------------

interface ISerializedUser {
  oid: string;
  refresh_token: string;
  access_token?: string;
  expires_at?: string;
}

passport.serializeUser((user: ISerializedUser, done) => {
  const stored = { oid: user.oid, refresh_token: user.refresh_token /*, access_token: user.access_token, expires_at: user.expires_at */ };
  done(null, stored);
});

passport.deserializeUser(async (stored: ISerializedUser, done) => {
  if (!stored || !stored.refresh_token) { return done(Error('no user profile')); }
  let oauth = await tokens.create(stored);
  if (oauth.expired()) {
    oauth = await oauth.refresh();
  }
  const profile = await graph.user(oauth.token.access_token).catch(reason => { log.error('could not retrieve profile', reason); });
  if (!profile) { return done(Error('no user profile')); }
  const result = { ...profile, ...stored, ...oauth.token };
  return done(null, result);
});

// array to hold logged in users
const users = new Map<string, any>();

const findByOid = (oid: string, fn: (err: Error, user: any) => void) => {
  log.info(`finding user by oid ${oid}`);
  if (users.has(oid)) {
    return fn(null, users.get(oid));
  }
  return fn(null, null);
};

// -----------------------------------------------------------------------------
// Use the OIDCStrategy within Passport.
//
// Strategies in passport require a `verify` function, which accepts credentials
// (in this case, the `oid` claim in id_token), and invoke a callback to find
// the corresponding user object.
//
// The following are the accepted prototypes for the `verify` function
// (1) function(iss, sub, done)
// (2) function(iss, sub, profile, done)
// (3) function(iss, sub, profile, access_token, refresh_token, done)
// (4) function(iss, sub, profile, access_token, refresh_token, params, done)
// (5) function(iss, sub, profile, jwtClaims, access_token, refresh_token, params, done)
// (6) prototype (1)-(5) with an additional `req` parameter as the first parameter
//
// To do prototype (6), passReqToCallback must be set to true in the config.
// -----------------------------------------------------------------------------
const azureStrategyOptions: passportAzureAD.IOIDCStrategyOptionWithRequest = {
  identityMetadata: config.creds.identityMetadata,
  clientID: config.creds.clientID,
  responseType: config.creds.responseType as typeof OIDCStrategyTemplate.responseType,
  responseMode: config.creds.responseMode as typeof OIDCStrategyTemplate.responseMode,
  redirectUrl: config.creds.redirectUrl,
  allowHttpForRedirectUrl: config.creds.allowHttpForRedirectUrl,
  clientSecret: config.creds.clientSecret,
  validateIssuer: config.creds.validateIssuer,
  isB2C: config.creds.isB2C,
  issuer: config.creds.issuer,
  passReqToCallback: true,
  scope: config.creds.scope,
  loggingLevel: config.creds.logLevel as typeof OIDCStrategyTemplate.loggingLevel,
  nonceLifetime: config.creds.nonceLifetime,
  nonceMaxAmount: config.creds.nonceMaxAmount,
  useCookieInsteadOfSession: config.creds.useCookieInsteadOfSession,
  cookieEncryptionKeys: config.creds.cookieEncryptionKeys,
  clockSkew: config.creds.clockSkew,
};

async function processAzureStrategy(req: express.Request,
  iss: string, sub: string, profile: passportAzureAD.IProfile, jwtClaims: any,
  access_token: string, refresh_token: string, oauthToken: any,
  done: passportAzureAD.VerifyCallback) {

  if (!profile.oid) {
    return done(new Error('No oid found'), null);
  }
  // asynchronous verification, for effect...
  process.nextTick(async () => {

    const fullProfile = await graph.user(access_token);
    if (!fullProfile) {
      return done(Error('no profile'));
    }
    fullProfile.oid = profile.oid;

    const oauth = tokens.create(oauthToken);
    const result = { ...fullProfile, ...oauth.token };

    return done(null, result);
  });
}

passport.use(new passportAzureAD.OIDCStrategy(azureStrategyOptions, processAzureStrategy));

// -----------------------------------------------------------------------------
// Config the app, include middlewares
// -----------------------------------------------------------------------------
const app = express();

app.use(morgan(config.httpLogFormat));
app.set('trust proxy', true);
app.set('views', path.join(__dirname, '../public/views'));
app.set('view engine', 'ejs');
app.use(express_request_id());
app.use(methodOverride());
app.use(cookieParser());
app.use(cookieSession({ secret: 'xyzzy       1234', secure: false, maxAge: 1000 * 60 * 60 * 24 * 365 }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());

// -----------------------------------------------------------------------------
// Set up the route controller
//
// 1. For 'login' route and 'returnURL' route, use `passport.authenticate`.
// This way the passport middleware can redirect the user to login page, receive
// id_token etc from returnURL.
//
// 2. For the routes you want to check if user is already logged in, use
// `ensureAuthenticated`. It checks if there is an user stored in session, if not
// it will call `passport.authenticate` to ask for user to log in.
// -----------------------------------------------------------------------------
function ensureAuthenticated(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
}

function ensureAuthenticatedApi(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.isAuthenticated()) { return next(); }
  res.sendStatus(401).end();
  return next();
}

app.get('/', (req, res) => {
  res.render('index', { user: req.user });
});

// '/account' is only available to logged in user
app.get('/account', ensureAuthenticated, (req, res, next) => {
  res.render('account', { user: req.user });
});

app.get('/login',
  (req, res, next) => {
    log.info('testing');
    passport.authenticate('azuread-openidconnect',
      {
        response: res,                      // required
        // resourceURL: config.creds.redirectUrl,    // optional. Provide a value if you want to specify the resource.
        customState: 'my_state',            // optional. Provide a value if you want to provide custom state value.
        failureRedirect: '/',
        // session: false,
      } as passport.AuthenticateOptions,
    )(req, res, next);
  },
  (req, res) => {
    log.info('login was called');
    res.redirect('/');
  });

// 'GET returnURL'
// `passport.authenticate` will try to authenticate the content returned in
// query (such as authorization code). If authentication fails, user will be
// redirected to '/' (home page); otherwise, it passes to the next middleware.
app.get('/auth/openid/return',
  (req, res, next) => {
    passport.authenticate('azuread-openidconnect',
      {
        response: res,                      // required
        failureRedirect: '/',
        // session: false,

      } as passport.AuthenticateOptions,
    )(req, res, next);
  },
  (req, res, next) => {
    log.info('received a return from AzureAD.');
    res.redirect('/');
  });

// 'POST returnURL'
// `passport.authenticate` will try to authenticate the content returned in
// body (such as authorization code). If authentication fails, user will be
// redirected to '/' (home page); otherwise, it passes to the next middleware.
app.post('/auth/openid/return',
  (req, res, next) => {
    passport.authenticate('azuread-openidconnect',
      {
        response: res,                      // required
        failureRedirect: '/',
        // session: false,
      } as passport.AuthenticateOptions,
    )(req, res, next);
  },
  (req, res, next) => {
    log.info('received a return from AzureAD.');
    res.redirect('/');
  });

// 'endsession' route, logout from passport, and destroy the session with AAD.
app.get('/endsession', (req, res) => {
  req.session = null;
  req.logOut();
  res.redirect('/');
});

// 'logout' route, logout from passport, and destroy the session with AAD.
app.get('/logout', (req, res) => {
  req.session = null;
  // req.session.destroy((err) => {
  req.logOut();
  res.redirect(config.destroySessionUrl);
});

app.get('/api/v1.0/me', ensureAuthenticatedApi,
  async (req, res, next) => {
    try {
      let oauth = tokens.create(req.user as tokens.IToken);
      if (oauth.expired()) { oauth = await oauth.refresh(); }
      const result = await graph.user(oauth.token.access_token);
      res.json(result);
      res.end();
      next();
    } catch (error) {
      res.status(error.statusCode).json(error).end();
      return next();
    }
  });

app.get('/api/v1.0/profile', ensureAuthenticatedApi,
  async (req, res, next) => {
    try {
      let oauth = tokens.create(req.user as tokens.IToken);
      if (oauth.expired()) { oauth = await oauth.refresh(); }
      const result = await graph.client(oauth.token.access_token).api('/me/extensions/com.code-with.vott').get();
      res.json(result);
      res.end();
      next();
    } catch (error) {
      res.status(error.statusCode).json(error).end();
      return next();
    }
  });

app.put('/api/v1.0/profile', ensureAuthenticatedApi,
  async (req, res, next) => {
    try {
      let oauth = tokens.create(req.user as tokens.IToken);
      if (oauth.expired()) { oauth = await oauth.refresh(); }
      const body = { ...req.body, extensionName: 'com.code-with.vott' };
      let result = null;
      try { // Handle bad graph open extension semantics
        result = await graph.client(oauth.token.access_token).api('/me/extensions/').post(body);
      } catch (error) {
        // if it already exists and we are replacing.  Delete and try again.
        result = await graph.client(oauth.token.access_token).api('/me/extensions/com.code-with.vott').delete();
        result = await graph.client(oauth.token.access_token).api('/me/extensions').post(body);
      }
      res.json(result);
      res.end();
      next();
    } catch (error) {
      res.status(error.statusCode).json(error).end();
      return next();
    }
  });

app.get('/api/v1.0/cloudconnections/:id', ensureAuthenticatedApi,
  async (req, res, next) => {
    try {
      const id = req.params.id;  // careful should only be a domain name pattern.
      let oauth = tokens.create(req.user as tokens.IToken);
      if (oauth.expired()) { oauth = await oauth.refresh(); }
      const result = await graph.client(oauth.token.access_token).api(`/me/extensions/com.code-with.vott.${id}`).get();
      res.json(result);
      res.end();
      next();
    } catch (error) {
      res.status(error.statusCode).json(error).end();
      return next();
    }
  });

app.put('/api/v1.0/cloudconnections/:id', ensureAuthenticatedApi,
  async (req, res, next) => {
    try {
      const id = req.params.id;  // careful should only be a domain name pattern.
      let oauth = tokens.create(req.user as tokens.IToken);
      if (oauth.expired()) { oauth = await oauth.refresh(); }
      const body = { ...req.body, extensionName: `com.code-with.vott.${id}` };
      let result = null;
      try { // Handle bad graph open extension semantics
        result = await graph.client(oauth.token.access_token).api('/me/extensions/').post(body);
      } catch (error) {
        // if it already exists and we are replacing.  Delete and try again.
        result = await graph.client(oauth.token.access_token).api(`/me/extensions/com.code-with.vott.${id}`).delete();
        result = await graph.client(oauth.token.access_token).api('/me/extensions').post(body);
      }
      res.json(result);
      res.end();
      next();
    } catch (error) {
      res.status(error.statusCode).json(error).end();
      return next();
    }
  });

app.patch('/api/v1.0/cloudconnections/:id', ensureAuthenticatedApi,
  async (req, res, next) => {
    try {
      const id = req.params.id;  // careful should only be a domain name pattern.
      let oauth = tokens.create(req.user as tokens.IToken);
      if (oauth.expired()) { oauth = await oauth.refresh(); }
      const body = { ...req.body, extensionName: `com.code-with.vott.${id}` };
      const result = await graph.client(oauth.token.access_token).api(`/me/extensions/com.code-with.vott.${id}`).patch(body);
      res.json(result);
      res.end();
      next();
    } catch (error) {
      res.status(error.statusCode).json(error).end();
      return next();
    }
  });

app.delete('/api/v1.0/cloudconnections/:id', ensureAuthenticatedApi,
  async (req, res, next) => {
    try {
      const id = req.params.id;  // careful should only be a domain name pattern.
      let oauth = tokens.create(req.user as tokens.IToken);
      if (oauth.expired()) { oauth = await oauth.refresh(); }
      const result = await graph.client(oauth.token.access_token).api(`/me/extensions/com.code-with.vott.${id}`).delete();
      res.end();
      return next();
    } catch (error) {
      res.status(error.statusCode).json(error).end();
      return next();
    }
  });

app.use('/public', express.static(path.join(__dirname, '../public')));

app.listen(config.port);
