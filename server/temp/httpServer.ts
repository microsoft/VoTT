import * as http from 'http';
import * as restify from 'restify';

import { OpenTypeExtension, OutlookTask } from '@microsoft/microsoft-graph-types-beta';
import { User } from './users';
import { logger } from './utils';

export class Server {
    public server: restify.Server;

    constructor(port: string, requestListener?: (req: http.IncomingMessage, res: http.ServerResponse) => void) {
        this.server = restify.createServer({ maxParamLength: 1000 } as restify.ServerOptions);
        configureServer(this.server);
        this.server.listen(port, () => {
            console.log(logger`${this.server.name} listening to ${this.server.url}`);
        });
    }

    public async asyncClose(callback?: () => void): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.server.close(() => {
                console.log('Closed httpServer');
                if (callback) { callback(); }
                return resolve();
            });
        });
    }

}

function configureServer(httpServer: restify.Server) {

    httpServer.pre((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'X-Requested-With');
        return next();
    });

    httpServer.use(restify.plugins.bodyParser());
    httpServer.use(restify.plugins.queryParser());

    httpServer.use((req, res, next) => {
        console.log(logger`Request for ${req.url} `);
        next();
    });

    //// Static pages

    httpServer.get('/', (req, res, next) => { res.redirect('./public/app.html', next); });
    httpServer.get('/public/app.html*', restify.plugins.serveStatic({ directory: __dirname + '/../public', file: 'app.html' }));
    httpServer.get('/public/*', restify.plugins.serveStatic({ directory: __dirname + '/..' }));

    //// Authentication logic for Web

    httpServer.get('/login', (req, res, next) => {
        const host = req.headers.host;
        const protocol = host.toLowerCase().includes('localhost') || host.includes('127.0.0.1') ? 'http://' : 'https://';
        const authUrl = app.authManager.authUrl({ redirect: new URL(AppConfig.authPath, protocol + host).href, state: protocol + host });
        console.log(logger`redirecting to ${authUrl} `);
        res.redirect(authUrl, next);
    });

    httpServer.get('/auth', async (req, res, next) => {
        try {
            // look for authorization code coming in (indicates redirect from interative login/consent)
            const code = req.query.code;
            if (code) {
                const host = req.headers.host;
                const protocol = host.toLowerCase().includes('localhost') || host.includes('127.0.0.1') ? 'http://' : 'https://';
                const authContext = await app.authManager.newContextFromCode(code, protocol + host + '/auth');
                const profile = await app.graph.getProfile(await app.authManager.getAccessToken(authContext));
                const user: User = { oid: authContext.oid, authKey: authContext.authKey, authTokens: authContext };
                if (profile.preferredName) { user.preferredName = profile.preferredName; }
                if (profile.mail) { user.email = profile.mail; }
                await app.users.set(authContext.oid, user);
                res.header('Set-Cookie', 'userId=' + authContext.authKey + '; expires=' + new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString());
                const stateString: string = req.query.state;
                let state: any = {};
                try { state = JSON.parse(stateString); } catch (e) {
                    console.log(logger`bad state string`);
                }
                if (!state.url) { state.url = '/'; }
                if (state.key) {
                    // should send verification code to user via web and wait for it on the bot.
                    // ignore for now.
                    const conversation = await app.conversationManager.setOidForUnauthenticatedConversation(state.key, authContext.oid);
                    await app.botService.processActivityInConversation(conversation, async (turnContext) => {
                        return await turnContext.sendActivity('Connected.');
                    });
                } // else no state.key so it is a plain web login
                res.redirect(state.url, next);
                return;
            }
        } catch (reason) {
            console.log('Error in /auth processing: ' + reason);
        }
        res.setHeader('Content-Type', 'text/html');
        res.end(htmlPageMessage('Error', 'Request to authorize failed', '<br/><a href="/">Continue</a>'));
        next();
        return;
    });

    httpServer.get('/task/:taskId', async (req, res, next) => {
        try {
            const authContext = await app.authManager.getAuthContextFromAuthKey(getCookie(req, 'userId'));
            if (!authContext || !authContext.oid) {
                console.log('not logged in');
                res.setHeader('Content-Type', 'text/html');
                res.end(htmlPageMessage('Task', 'Not logged in.', '<br/><a href="/">Continue</a>'));
                return next();
            }
            const taskId = req.params.taskId;
            const accessToken = await app.authManager.getAccessTokenFromAuthKey(authContext.authKey);
            const data = await app.graph.get(accessToken, `https://graph.microsoft.com/beta/me/outlook/tasks/${taskId}?${app.graph.queryExpandNagExtensions}`);
            res.setHeader('Content-Type', 'text/html');
            res.end(htmlPageFromObject('task', '', data, '<br/><a href="/">Continue</a>'));
            return next();
        } catch (err) {
            console.log(`GET /task failed. (${err}()`);
            res.setHeader('Content-Type', 'text/html');
            res.end(htmlPageFromObject('Task', 'Error.  Are you logged in', err, '<br/><a href="/">Continue</a>'));
            return next();
        }
    });

    // APIs - no html - just json response

    httpServer.get('/api/v1.0/me', async (req, res, next) => {
        await graphGet(req, res, next, 'https://graph.microsoft.com/v1.0/me');
    });

    httpServer.get('/api/v1.0/me/connections', async (req, res, next) => {
        let error: any;
        try {
            const accessToken = await app.authManager.getAccessTokenFromAuthKey(getCookie(req, 'userId'));
            const conversations = await app.graph.getConversations(accessToken);
            res.json(200, conversations);
            res.end();
            return next();
        } catch (err) {
            error = err;
        }
        res.status(400);
        res.json({ error });
        res.end();
        return next();
    });

    httpServer.patch('/api/v1.0/me/connections/:id', async (req, res, next) => {
        const id = req.params.id;  // this is ignored for now
        const data = req.body;
        let error: any;
        try {
            const authContext = await app.authManager.getAuthContextFromAuthKey(getCookie(req, 'userId'));
            if (!authContext || !authContext.oid) { throw new Error('/me/connections-PATCH: Could not identify user'); }
            app.conversationManager.upsert(authContext.oid, data);
            res.status(200);
            res.end();
            return next();
        } catch (err) { error = error; }
        res.status(400);
        res.json({ error });
        res.end();
        return next();
    });

    httpServer.del('/api/v1.0/me/connections/:id', async (req, res, next) => {
        const id = req.params.id;  // this is ignored for now
        const data = req.body;
        let error: any;
        try {
            const authContext = await app.authManager.getAuthContextFromAuthKey(getCookie(req, 'userId'));
            if (!authContext || !authContext.oid) { throw new Error('/me/connections-PATCH: Could not identify user'); }
            app.conversationManager.delete(authContext.oid, data);
            res.status(200);
            res.end();
            return next();
        } catch (err) { error = err; }
        res.status(400);
        res.json({ error });
        res.end();
        return next();
    });


//// Automatic response generators for graph information

async function graphGet(req: restify.Request, res: restify.Response, next: restify.Next, url: string, composer?: (result: any) => string) {
    let errorMessage: string | null = null;
    try {
        const accessToken = await app.authManager.getAccessTokenFromAuthKey(getCookie(req, 'userId'));
        const data = await app.graph.get(accessToken, url);
        if (data) {
            if (composer) {
                res.setHeader('Content-Type', 'text/html');
                res.end(composer(data));
            } else {
                res.json(data);
                res.end();
            }
            return next();
        }
        errorMessage = 'No value';
    } catch (err) {
        errorMessage = 'graphForwarder error.  Detail: ' + err;
    }
    if (composer) {
        res.setHeader('Content-Type', 'text/html');
        res.end(htmlPageFromList('Error', errorMessage, [], '<a href="/">Continue</a>'));
    } else {
        res.status(400);
        res.json({ errorMessage });
        res.end();
    }
    return next();
}

async function graphPatch(req: restify.Request, res: restify.Response, next: restify.Next, url: string, data: string) {
    let errorMessage = '';
    try {
        const accessToken = await app.authManager.getAccessTokenFromAuthKey(getCookie(req, 'userId'));
        const result = await app.graph.patch(accessToken, url, data);
        res.json(200, result);
        res.end();
        return next();
    } catch (err) {
        errorMessage = 'graphForwarder error.  Detail: ' + err;
    }
    res.setHeader('Content-Type', 'text/html');
    res.end(htmlPageFromList('Error', errorMessage, [], '<a href="/">Continue</a>'));
    return next();
}

//// Utiliies

function getCookie(req: restify.Request, key: string): string {
    const list = {} as { [index: string]: string };
    const rc = req.header('cookie');

    if (rc) {
        rc.split(';').forEach((cookie) => {
            const parts = cookie.split('=');
            const name = parts.shift().trim();
            if (name) { list[name] = decodeURI(parts.join('=')); }
        });
    }

    return (key && key in list) ? list[key] : null;
}