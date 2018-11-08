const Application = require('spectron').Application;
const electron = require('electron');
const path = require('path');
const fakeDialog = require('spectron-fake-dialog');

const spectronHelper = require("./helpers/spectron_helper");

describe('E2E', () => {
    describe('App', () => {
        describe('General', () => {
            beforeAll((done) => {
                app = spectronHelper.initializeSpectron()
                fakeDialog.apply(app); // Sets up fake dialog mock
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
        })
        

        describe('Importing Images', () => {
            let tagCount = 0;
            let originalImageValue = null;

            beforeAll((done) => {
                app = spectronHelper.initializeSpectron()
                fakeDialog.apply(app); // Sets up fake dialog mock
                app.start().then(() => {
                    fakeDialog.mock([{
                        method: 'showOpenDialog',
                        value: [path.join(__dirname, 'sample_data/sample_images')]
                    }]);
                }).then(done);
            });
    
            afterAll((done) => {
                app.stop().then(done);
            });

            it('clicking images directory loads tagging configuration', (done) => {
                app.client.click('#dirImage').then(() => {
                    app.client.waitForVisible('#load-form-container', 1000);

                    const visible = app.client.isVisible('#load-form-container h2');
                    expect(visible).toBeTruthy();

                    const getText = app.client.getText('#load-form-container h2')
                        .then(text => expect(text).toEqual('Tagging Job Configuration'));

                    const getTags = app.client.elements('.tag')
                        .then(elements => {
                            tagCount = elements.value.length;
                            expect(elements.value.length).toBeGreaterThan(0);
                        });

                    Promise.all([getText, getTags]).then(done);
                })
            });

            it('clicking "Continue" button loads tagging screen', (done) => {
                app.client.click('#loadButton').then(() => {
                    const visible = app.client.isVisible('#video-tagging-container');
                    expect(visible).toBeTruthy();

                    const getImageFrame = app.client.getValue('#frameText')
                        .then(result => expect(result).toEqual("1"));

                    const getImageProperty = app.client.getCssProperty('#vid', 'backgroundImage')
                        .then(imagePath => expect(imagePath.value.length).toBeGreaterThan(0));

                    const getTagButtons = app.client.elements('.tagButtons')
                        .then(elements => {
                            expect(elements.value.length).toBeGreaterThan(0);
                            expect(elements.value.length).toEqual(tagCount);
                        });

                    Promise.all([getImageFrame, getImageProperty, getTagButtons]).then(done);
                });
            });

            it('clicking "Next" button loads the next image', (done) => {
                app.client.getCssProperty('#vid', 'backgroundImage')
                    .then(imagePath => {
                        originalImageValue = imagePath.value;
                        return app.client.click('#stepfwd');
                    })
                    .then(() => app.client.getCssProperty('#vid', 'backgroundImage'))
                    .then(currentImageValue => expect(currentImageValue.value).not.toEqual(originalImageValue))
                    .then(() => app.client.getValue('#frameText'))
                    .then(value => expect(value).toEqual("2"))
                    .then(done);
            });

            it('clicking "Previous" button loads the previous image', (done) => {
                app.client.click('#stepbwd')
                    .then(() => app.client.getCssProperty('#vid', 'backgroundImage'))
                    .then(currentImageValue => expect(currentImageValue.value).toEqual(originalImageValue))
                    .then(() => app.client.getValue('#frameText'))
                    .then(value => expect(value).toEqual("1"))
                    .then(done);
            });
        });

        describe('Importing Video', () => {
            let tagCount = 0;
            let originalImageValue = null;

            beforeAll((done) => {
                app = spectronHelper.initializeSpectron()
                fakeDialog.apply(app); // Sets up fake dialog mock
                app.start().then(() => {
                    fakeDialog.mock([{
                        method: 'showOpenDialog',
                        value: [path.join(__dirname, 'sample_data/sample_video.mp4')]
                    }]);
                }).then(done);
            });
    
            afterAll((done) => {
                app.stop().then(done);
            });

            it('clicking video loads tagging configuration', (done) => {
                app.client.click('#vidImage').then(() => {
                    app.client.waitForVisible('#load-form-container', 1000);

                    const visible = app.client.isVisible('#load-form-container h2');
                    expect(visible).toBeTruthy();

                    const getText = app.client.getText('#load-form-container h2')
                        .then(text => expect(text).toEqual('Tagging Job Configuration'));

                    const getTags = app.client.elements('.tag')
                        .then(elements => {
                            tagCount = elements.value.length;
                            expect(elements.value.length).toBeGreaterThan(0);
                        });

                    Promise.all([getText, getTags]).then(done);
                })
            });

            // it('clicking "Continue" button loads tagging screen', (done) => {
            //     app.client.click('#loadButton').then(() => {
            //         const visible = app.client.isVisible('#video-tagging-container');
            //         expect(visible).toBeTruthy();

            //         const getImageFrame = app.client.getValue('#frameText')
            //             .then(result => expect(result).toEqual("1"));

            //         const getImageProperty = app.client.getCssProperty('#vid', 'backgroundImage')
            //             .then(imagePath => expect(imagePath.value.length).toBeGreaterThan(0));

            //         const getTagButtons = app.client.elements('.tagButtons')
            //             .then(elements => {
            //                 expect(elements.value.length).toBeGreaterThan(0);
            //                 expect(elements.value.length).toEqual(tagCount);
            //             });

            //         Promise.all([getImageFrame, getImageProperty, getTagButtons]).then(done);
            //     });
            // });

            // it('clicking "Next" button loads the next image', (done) => {
            //     app.client.getCssProperty('#vid', 'backgroundImage')
            //         .then(imagePath => {
            //             originalImageValue = imagePath.value;
            //             return app.client.click('#stepfwd');
            //         })
            //         .then(() => app.client.getCssProperty('#vid', 'backgroundImage'))
            //         .then(currentImageValue => expect(currentImageValue.value).not.toEqual(originalImageValue))
            //         .then(() => app.client.getValue('#frameText'))
            //         .then(value => expect(value).toEqual("2"))
            //         .then(done);
            // });

            // it('clicking "Previous" button loads the previous image', (done) => {
            //     app.client.click('#stepbwd')
            //         .then(() => app.client.getCssProperty('#vid', 'backgroundImage'))
            //         .then(currentImageValue => expect(currentImageValue.value).toEqual(originalImageValue))
            //         .then(() => app.client.getValue('#frameText'))
            //         .then(value => expect(value).toEqual("1"))
            //         .then(done);
            // });
        });
    });
});