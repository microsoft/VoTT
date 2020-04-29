
// import { default as fetch } from 'node-fetch';
import * as config from '../config';
import { app, server } from '../app';
import { ServerResponse } from 'http';


beforeAll(async (done) => {
    if (!server.listening) { 
        server.on('listening', done())
    } else {
        done();
    }
});

afterAll(async (done) => {
    server.close(() => { 
        console.log('done');
        done();
    });
});

describe('App Server', () => {

    afterAll(async (done) => {
        server.close(() => { 
            console.log('done');
            done();
        });
    });

    test('initialized', async (done) => {
        expect(app.name).toBeDefined();
        expect(server.listening).toBe(true);
        done();
    });

    test('loads app.html', async (done) => {
        const response = await fetch(config.baseUrl);
        expect(response.status).toBe(200);
        done();
    });

    test('redirects to login', async (done) => {
        const response = await fetch(config.baseUrl + '/api/v1.0/me');
        expect(response.status).toBe(404);
        done();
    });

});
