const path = require('path');
const fakeDialog = require('spectron-fake-dialog');
const helper = require('./helpers/spectron_helper');
const fs = require('fs');

describe('E2E - New Project', () => {
    let app = null;

    beforeAll((done) => {
        app = helper.initializeSpectron()
        fakeDialog.apply(app); // Sets up fake dialog mock
        app.start().then(done);
    });

    afterAll((done) => {
        app.stop().then(done);
    });

    describe('Creating Tags', () => {
        const expectedTags = ['polar-bear', 'grizzly-bear'];

        beforeAll(() => {
            fakeDialog.mock([{
                method: 'showOpenDialog',
                value: [path.join(__dirname, 'sample_data/new_images')]
            }]);
        });

        it('typing in the input field creates tags', (done) => {
            app.client.click('#dirImage')
                .then(() => app.client.waitForVisible('#load-form-container', 1000))
                .then(() => app.client.click('.bootstrap-tagsinput'))
                // Create a tag
                .then(() => app.client.keys(expectedTags[0]))
                .then(() => app.client.keys('\uE006')) // Enter
                // Create another tag
                .then(() => app.client.keys(expectedTags[1]))
                .then(() => app.client.keys('\uE006')) // Enter
                .then(() => app.client.getText('.bootstrap-tagsinput .tag'))
                .then(result => {
                    tagCount = result.length;
                    expect(result.length).toEqual(2);
                    expect(result[0]).toEqual(expectedTags[0]);
                    expect(result[1]).toEqual(expectedTags[1]);
                })
                .then(done);
        });

        it('clicking "Continue" loads the tagging screen', (done) => {
            app.client.click('#loadButton')
                .then(() => app.client.waitForVisible('#video-tagging-container', 1000))
                .then(() => app.client.isVisible('#video-tagging-container'))
                .then(result => expect(result).toBeTruthy())
                .then(() => app.client.getValue('#frameText'))
                .then(result => expect(result).toEqual('1'))
                .then(() => app.client.getCssProperty('#vid', 'backgroundImage'))
                .then(imagePath => expect(imagePath.value.length).toBeGreaterThan(0))
                .then(() => app.client.elements('.tagButtons'))
                .then(elements => {
                    expect(elements.value.length).toBeGreaterThan(0);
                    expect(elements.value.length).toEqual(expectedTags.length);
                })
                .then(done);
        });

        it('clicking and dragging on an image creates a new tag', (done) => {
            app.client.moveToObject('#selectionZone', 100, 100)
                // Create tag selection on Image 1
                .then(() => app.client.buttonDown())
                .then(result => app.client.moveTo(null, 200, 200))
                .then(() => app.client.buttonUp())
                .then(() => app.client.waitForVisible('.dragLayer', 2000))
                // Assign tag 1 on Image 1
                .then(() => app.client.click(`#${expectedTags[1]}`))
                .then(() => app.client.waitForVisible('.tagsLayer', 2000))
                .then(() => app.client.elements('.tagsLayer'))
                .then(result => expect(result.value.length).toEqual(1))
                .then(done);
        });

        it('clicking "File > Save" saves the project configuration', (done) => {
            helper.isApplicationMenuItemEnabled(app, 'Object Detection', 'Export')
                .then(result => expect(result).toBeTruthy())
                .then(() => helper.send(app, 'saveVideo'))
                .then(() => app.client.pause(1000))
                .then(() => {
                    const expectedPath = path.join(__dirname, 'sample_data/new_images.json');
                    fs.exists(expectedPath, exists => {
                        expect(exists).toBeTruthy();

                        fs.readFile(expectedPath, 'utf8', (err, data) => {
                            if (err) {
                                throw new Error(err);
                            }

                            const projectConfig = JSON.parse(data);

                            // Validate tags have been created
                            expect(projectConfig.inputTags).toContain(expectedTags.join(','));
                            if (projectConfig.frames['grizzly-bear.jpg'][0].tags[0]){
                                expect(projectConfig.frames['grizzly-bear.jpg'][0].tags[0]).toEqual('grizzly-bear');
                            }

                            fs.unlink(expectedPath, done);
                        });
                    });
                });
        });
    });
});