const path = require('path');
const fakeDialog = require('spectron-fake-dialog');
const helper = require('./helpers/spectron_helper');

describe('E2E - Video', () => {
    beforeAll((done) => {
        app = helper.initializeSpectron()
        fakeDialog.apply(app); // Sets up fake dialog mock
        app.start().then(done);
    });

    afterAll((done) => {
        app.stop().then(done);
    });

    describe('Importing Video', () => {
        let tagCount = 0;

        beforeAll(() => {
            fakeDialog.mock([{
                method: 'showOpenDialog',
                value: [path.join(__dirname, 'sample_data/sample_video.mp4')]
            }]);
        });

        it('clicking images directory loads tagging configuration', (done) => {
            app.client.click('#vidImage')
                .then(() => app.client.waitForVisible('#load-form-container', 1000))
                .then(() => app.client.isVisible('#load-form-container h2'))
                .then(result => expect(result).toBeTruthy())
                .then(() => app.client.getText('#load-form-container h2'))
                .then(text => expect(text).toEqual('Tagging Job Configuration'))
                .then(() => app.client.elements('.tag'))
                .then(elements => {
                    tagCount = elements.value.length;
                    expect(elements.value.length).toBeGreaterThan(0);
                })
                .then(done);
        });

        it('clicking "Continue" button loads tagging screen', (done) => {
            app.client.click('#loadButton')
                .then(() => app.client.waitForVisible('#video-tagging-container', 1000))
                .then(() => app.client.isVisible('#video-tagging-container'))
                .then(result => expect(result).toBeTruthy())
                .then(result => app.client.waitForValue('#frameText', 1000))
                .then(() => app.client.getValue('#frameText'))
                .then(result => expect(result).toEqual('1'))
                .then(() => app.client.getCssProperty('#vid', 'backgroundImage'))
                .then(imagePath => expect(imagePath.value.length).toBeGreaterThan(0))
                .then(() => app.client.elements('.tagButtons'))
                .then(elements => {
                    expect(elements.value.length).toBeGreaterThan(0);
                    expect(elements.value.length).toEqual(tagCount);
                })
                .then(done);
        });
    });
});