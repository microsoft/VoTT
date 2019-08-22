
/******************************************************************************
 * Module dependencies.
 *****************************************************************************/

import * as bodyParser from 'body-parser';
import * as bunyan from 'bunyan';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import * as expressSession from 'express-session';
import * as methodOverride from 'method-override';
import * as passport from 'passport';
import * as passportAzureAD from 'passport-azure-ad';
import * as config from './config';
import * as path from 'path';

// set up database for express session
import ConnectMongo = require('connect-mongo');
const MongoStore = ConnectMongo(expressSession);
import mongoose = require('mongoose');

// Start QuickStart here

const OIDCStrategyTemplate = {} as passportAzureAD.IOIDCStrategyOptionWithoutRequest;

const log = bunyan.createLogger({
  name: 'Microsoft OIDC Example Web Application',
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
passport.serializeUser((user: any, done) => {
  done(null, user.oid);
});

passport.deserializeUser((oid: number, done) => {
  findByOid(oid, (err, user) => {
    done(err, user);
  });
});

// array to hold logged in users
const users: any[] = [];

const findByOid = (oid: number, fn: (err: Error, user: any) => void) => {
  for (let i = 0, len = users.length; i < len; i++) {
    const user = users[i];
    log.info('we are using user: ', user);
    if (user.oid === oid) {
      return fn(null, user);
    }
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
passport.use(new passportAzureAD.OIDCStrategy({
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
  passReqToCallback: false,
  scope: config.creds.scope,
  loggingLevel: config.creds.loggingLevel as typeof OIDCStrategyTemplate.loggingLevel,
  nonceLifetime: config.creds.nonceLifetime,
  nonceMaxAmount: config.creds.nonceMaxAmount,
  useCookieInsteadOfSession: config.creds.useCookieInsteadOfSession,
  cookieEncryptionKeys: config.creds.cookieEncryptionKeys,
  clockSkew: config.creds.clockSkew,
},
  (iss: any, sub: any, profile: any, accessToken: any, refreshToken: any, done: any) => {
    if (!profile.oid) {
      return done(new Error('No oid found'), null);
    }
    // asynchronous verification, for effect...
    process.nextTick(() => {
      findByOid(profile.oid, (err, user) => {
        if (err) {
          return done(err);
        }
        if (!user) {
          // "Auto-registration"
          users.push(profile);
          return done(null, profile);
        }
        return done(null, user);
      });
    });
  },
));

// -----------------------------------------------------------------------------
// Config the app, include middlewares
// -----------------------------------------------------------------------------
const app = express();

app.set('views', path.join(__dirname, '../public/views'));
app.set('view engine', 'ejs');
// app.use(express.logger());
app.use(methodOverride());
app.use(cookieParser());

// set up session middleware
if (config.useMongoDBSessionStore) {
  mongoose.connect(config.databaseUri);
  app.use(expressSession({
    secret: 'secret',
    cookie: { maxAge: config.mongoDBSessionMaxAge * 1000 },
    store: new MongoStore({
      mongooseConnection: mongoose.connection,
      // clear_interval: config.mongoDBSessionMaxAge,
    }),
  }));
} else {
  app.use(expressSession({ secret: 'keyboard cat', resave: true, saveUninitialized: false }));
}

app.use(bodyParser.urlencoded({ extended: true }));

// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
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
function ensureAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
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
    passport.authenticate('azuread-openidconnect',
      {
        response: res,                      // required
        // resourceURL: config.creds.redirectUrl,    // optional. Provide a value if you want to specify the resource.
        customState: 'my_state',            // optional. Provide a value if you want to provide custom state value.
        failureRedirect: '/',
      } as passport.AuthenticateOptions,
    )(req, res, next);
  },
  (req, res) => {
    log.info('Login was called in the Sample');
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
      } as passport.AuthenticateOptions,
    )(req, res, next);
  },
  (req, res, next) => {
    log.info('We received a return from AzureAD.');
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
      } as passport.AuthenticateOptions,
    )(req, res, next);
  },
  (req, res, next) => {
    log.info('We received a return from AzureAD.');
    res.redirect('/');
  });

// 'logout' route, logout from passport, and destroy the session with AAD.
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    req.logOut();
    res.redirect(config.destroySessionUrl);
  });
});


var cloudConnections = new Map<string, any>([
  ['connection1', { foo: 'bar' }],
  ['connection2', { foo: 'baz' }]
]);

app.get('/api/v1.0/cloudconnections', ensureAuthenticated, (req, res, next) => {
  res.json(Array.from(cloudConnections.keys()));
  res.end();
  next();
});

app.get('/api/v1.0/cloudconnections/:id', ensureAuthenticated, (req, res, next) => {
  const id = req.params.id;
  res.json(cloudConnections.get(id));
  res.end();
  next();
});

app.put('/api/v1.0/cloudconnections/:id', ensureAuthenticated, (req, res, next) => {
  const id = req.params.id;
  const body = req.body;
  const status = cloudConnections.has(id) ? 200 : 201;
  cloudConnections.set(id, body);
  res.sendStatus(status);
  res.json(body);
  next();
});

app.delete('/api/v1.0/cloudconnections/:id', ensureAuthenticated, (req, res, next) => {
  const id = req.params.id;
  if (cloudConnections.has(id)) {
    res.sendStatus(404).end();
    return next();
  }
  cloudConnections.delete(id);
  res.end()
  return next();
});



app.use('/public', express.static(path.join(__dirname, '../public')));



app.listen(3000);
