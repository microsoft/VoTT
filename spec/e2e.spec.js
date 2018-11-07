var Application = require('spectron').Application
const electronPath = require('electron')
const path = require('path')

describe('E2E', () => {
    describe('App', () => {
        let app = null;

        beforeAll((done) => {
            app = new Application({
                path: electronPath,
                args: [path.join(__dirname, '..')]
            });

            app.start().then(done);
        });

        afterAll((done) => {
            app.stop().then(done);
        });

        it('is visible', () => {
            expect(app.browserWindow.isVisible()).toBeTruthy();
        });

        it('title is set', (done) => {
            app.client.getTitle()
                .then(title => expect(title).toEqual('Visual Object Tagging Tool'))
                .then(done);
        });
    });
});