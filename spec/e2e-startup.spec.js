const path = require('path');
const fakeDialog = require('spectron-fake-dialog');
const helper = require('./helpers/spectron_helper');

describe('E2E - Startup', () => {
    describe('Shell', () => {
        let app = null;

        beforeAll((done) => {
            app = helper.initializeSpectron()
            fakeDialog.apply(app); // Sets up fake dialog mock
            app.start().then(done);
        });

        afterAll((done) => {
            app.stop().then(done);
        });

        it('is visible', (done) => {
            app.browserWindow.isVisible()
                .then(result => expect(result).toBeTruthy())
                .then(done);
        });

        it('title & url are set', (done) => {
            app.browserWindow.getURL()
                .then(url => expect(url).toContain('src/index.html'))
                .then(() => app.client.getTitle())
                .then(title => expect(title).toContain('Visual Object Tagging Tool'))
                .then(done);
        });

        it('displays menu options', (done) => {
            const expected = [
                'File',
                'Object Detection',
                'Edit',
                'Filters',
                'Debug',
                'Help'
            ];

            helper.getApplicationMenu(app)
                .then(result => {
                    expect(result.value.length).toEqual(6);
                    expect(result.value).toEqual(expected);
                })
                .then(done);
        });

        it('displays import buttons', (done) => {
            Promise.all([
                app.client.element('#dirImage'),
                app.client.element('#vidImage')
            ])
                .then(elements => {
                    elements.forEach(el => expect(el.value).not.toBeNull(`${el.selector} should not be null`))
                })
                .then(done);
        });
    });
});