const path = require('path');
const fakeDialog = require('spectron-fake-dialog');
const helper = require('./helpers/spectron_helper');
const rimraf = require('rimraf');
const fs = require('fs');

describe('E2E - Images', () => {
    let app = null;

    beforeAll((done) => {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;
        app = helper.initializeSpectron()
        fakeDialog.apply(app); // Sets up fake dialog mock
        app.start().then(done);
    });

    afterAll((done) => {
        app.stop().then(done);
    });

    describe('Importing Images', () => {
        let tagCount = 0;
        let originalImageValue = null;

        beforeAll(() => {
            fakeDialog.mock([{
                method: 'showOpenDialog',
                value: [path.join(__dirname, 'sample_data/sample_images')]
            }]);
        });

        it('clicking images directory loads tagging configuration', (done) => {
            app.client.click('#dirImage')
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

        it('clicking "Next" button loads the next image', (done) => {
            app.client.getCssProperty('#vid', 'backgroundImage')
                .then(imagePath => {
                    originalImageValue = imagePath.value;
                    app.client.click('#stepfwd');
                })
                .then(() => app.client.getCssProperty('#vid', 'backgroundImage'))
                .then(result => expect(result.value).not.toEqual(originalImageValue))
                .then(() => app.client.getValue('#frameText'))
                .then(value => expect(value).toEqual("2"))
                .then(done);
        });

        it('clicking "Previous" button loads the previous image', (done) => {
            app.client.click('#stepbwd')
                .then(() => app.client.getCssProperty('#vid', 'backgroundImage'))
                .then(result => expect(result.value).toEqual(originalImageValue))
                .then(() => app.client.getValue('#frameText'))
                .then(value => expect(value).toEqual('1'))
                .then(done);
        });

        it('Object Dection -> Export menu item is enabled', (done) => {
            helper.isApplicationMenuItemEnabled(app, 'Object Detection', 'Export')
                .then(result => expect(result).toBeTruthy())
                .then(done);
        });

        it('clicking "Object Detection > Export" displays export window', (done) => {
            helper.send(app, 'export')
                .then(() => app.client.windowHandles())
                .then(result => {
                    expect(result.value.length).toEqual(2)
                    return result.value[result.value.length - 1];
                })
                .then(handle => app.client.window(handle))
                .then(() => app.browserWindow.getURL())
                .then(url => expect(url).toContain('src/public/html/export-configuration.html'))
                .then(() => app.client.getTitle())
                .then(title => expect(title).toEqual('Export Configuration'))
                .then(done);
        });

        it('clicking "Export" button starts the export into Pascal VOC format', (done) => {
            app.client.windowHandles()
                .then(result => result.value[result.value.length - 1])
                .then(handle => app.client.window(handle))
                .then(() => app.client.pause(2000))
                .then(() => app.client.selectByValue('#format','Tensorflow Pascal VOC'))
                .then(() => app.client.getValue('#format'))
                .then(result => expect(result).toEqual('Tensorflow Pascal VOC'))
                .then(() => app.client.click('#exportButton'))
                .then(() => app.client.pause(2000))
                .then(() => {
                    const expectedPaths = ['Annotations','ImageSets','JPEGImages'].map((dir)=>path.join(__dirname, 'sample_data','sample_images_output',dir));
                    for(let expectedPath of expectedPaths){
                        fs.readdir(expectedPath, (err, files) => {
                            expect(files).toBeTruthy();
                            if (err) {
                                throw new Error(err);
                            }
                        });
                    }
                    rimraf(path.join(__dirname, 'sample_data','sample_images_output'), done);
                })
                .then(() => app.browserWindow.isVisible())
                .then(result => expect(result).toBeFalsy())
                .then(done);
        });

        it('clicking "Object Detection > Export" displays export window again', (done) => {
            helper.send(app, 'export')
                .then(() => app.client.windowHandles())
                .then(result => {
                    expect(result.value.length).toEqual(2)
                    return result.value[result.value.length - 1];
                })
                .then(handle => app.client.window(handle))
                .then(() => app.browserWindow.getURL())
                .then(url => expect(url).toContain('src/public/html/export-configuration.html'))
                .then(() => app.client.getTitle())
                .then(title => expect(title).toEqual('Export Configuration'))
                .then(done);
        });

        it('clicking "Export" button starts the export into TFRecord format', (done) => {
            app.client.windowHandles()
                .then(result => result.value[result.value.length - 1])
                .then(handle => app.client.window(handle))
                .then(() => app.client.pause(2000))
                .then(() => app.client.selectByValue('#format','TFRecords'))
                .then(() => app.client.getValue('#format'))
                .then(result => expect(result).toEqual('TFRecords'))
                .then(() => app.client.click('#exportButton'))
                .then(() => app.client.pause(5000))
                .then(async () => {
                    let testRecord = await helper.readRecord(path.join(__dirname, 'sample_data','sample_images_output'),'nike1.png.tfrecord');
                    expect(String.fromCharCode.apply(null, testRecord.features.feature['image/object/class/text'].bytesList.value[0])).toEqual('nike');
                    rimraf(path.join(__dirname, 'sample_data','sample_images_output'), done);
                    })
                .then(() => app.browserWindow.isVisible())
                .then(result => expect(result).toBeFalsy())
                .then(done);
        });
    });
});