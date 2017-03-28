const async = require('async');
const fs = require('fs');
const path = require('path');
const util = require('util');

const DEFAULT_DATA_SET_NAME = 'obj';
const CFG_TEMPLATE_FILE_PATH = path.join(__dirname, 'yolo-obj.cfg.template');

const OBJ_DATA_TAMPLATE = 'classes = %s\n' + 
                          'train  = data/train.txt\n' +
                          'valid  = data/test.txt\n' +
                          'names = %s.names\n' +
                          'backup = backup/'



// The Exporter interface - provides a mean to export the tagged frames
// data in the expected data format of the detection algorithm
// Constructor parameters:
//  exportDirPath - path to the directory where the exported file will be placed
//  classes - list of classes supported by the tagged data
//  posFramesCount - number of positive tagged frames
//  frameWidth - The width (in pixels) of the image frame
//  frameHeight - The height (in pixels) of the image frame
function Exporter(exportDirPath, classes, posFramesCount, frameWidth, frameHeight, testSplit) {
    var self = this;
    self.dataSetName = DEFAULT_DATA_SET_NAME;
    self.exportDirPath = exportDirPath;
    self.dataDirPath = path.join(self.exportDirPath, 'data');
    self.imagesDirPath = path.join(self.dataDirPath, self.dataSetName);
    self.trainFilePath = path.join(self.dataDirPath, 'train.txt');
    self.testFilePath = path.join(self.dataDirPath, 'test.txt');
    self.classes = classes;
    self.posFramesCount = posFramesCount;
    self.frameWidth = frameWidth;
    self.frameHeight = frameHeight;
    self.cfgTemplate = null;
    self.testFrameIndecies = null;
    self.posFrameIndex = null;
    self.testSplit = testSplit || 0.2;

    // will be used later when writing the image data to file
    self.classesDict = {};
    for (var i in classes) {
        self.classesDict[classes[i]] = i;
    }

    // Prepare everything for exporting (e.g. create metadata files,
    // directories, ..)    
    // Returns: A Promise object that resolves when the operation completes
    this.init = function init() {
        return new Promise(function(resolve, reject) {
            async.waterfall([
                generateTestIndecies.bind(null,self.testSplit),
                function updateIndecies(testIndecies, cb) {
                    self.posFrameIndex = 0;
                    self.testFrameIndecies = testIndecies;
                    cb();
                },
                ensureDirExists.bind(null, self.exportDirPath),
                deleteFileIfExists.bind(null, self.trainFilePath),
                deleteFileIfExists.bind(null, self.testFilePath),
                function getTemplate(cb) {
                    if (self.cfgTemplate) {
                        return cb();
                    }
                    fs.readFile(CFG_TEMPLATE_FILE_PATH, (err, data) => {
                        if (err) {
                            return cb(err)
                        }
                        self.cfgTemplate = data.toString();
                        cb();
                    })
                },
                function saveCfg(cb) {
                    // replace the placeholders
                    var filtersCount = (self.classes.length + 5) * 5;
                    var cfg = util.format(self.cfgTemplate, filtersCount, self.classes.length);
                    fs.writeFile(path.join(self.exportDirPath, 'yolo-' + self.dataSetName +'.cfg'), cfg, cb);
                },
                ensureDirExists.bind(null, self.dataDirPath),
                function saveObjectNames(cb) {
                    var objectNames = '';
                    for (var i in self.classes) {
                        objectNames += self.classes[i] + '\n';
                    }
                    fs.writeFile(path.join(self.dataDirPath, self.dataSetName + '.names'), objectNames, cb)
                },
                function saveObjectData(cb) {
                    var objectData = util.format(OBJ_DATA_TAMPLATE, self.classes.length, self.dataSetName);
                    fs.writeFile(path.join(self.dataDirPath, self.dataSetName + '.data'), objectData, cb);
                },
            ], function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }

    // Export a single frame to the training data
    // Parameters:
    //  frameFileName - The file name to use when saving the image file 
    //  frameBuffer - A buffer with the frame image data 
    //  bboxes  - a list of bboxes in the format of x1, y1, x2, y2 where the
    //           coordinates are in absolute values of the image
    //  tags - a list of objects containing the tagging data. Each object is in the format of:
    //         {'x1' : int, 'y1' : int, 'x2' : int, 'y2' : int, 'class' : string}
    //         Where (x1,y1) and (x2,y2) are the coordinates of the top left and bottom right corner
    //         of the bounding boxes (respectively), and 'class' is the name of the class.
    // Returns: A Promise object that resolves when the operation completes
    this.exportFrame = function exportFrame(frameFileName, frameBuffer, tags) {
        return new Promise(function(resolve, reject) {
            async.waterfall([
                ensureDirExists.bind(null, self.imagesDirPath),
                function saveImage(cb) {
                    var imageFilePath = path.join(self.imagesDirPath, frameFileName);
                    fs.writeFile(imageFilePath, frameBuffer, cb); 
                },
                function saveBBoxesData(cb) {
                    imageDataFilePath = path.join(self.imagesDirPath, path.parse(frameFileName).name + '.txt');
                    var bboxesData = '';
                    for (var i in tags) {
                        var tag = tags[i];
                        var classIndex = self.classesDict[tag.class];
                        var relWidth = (tag.x2 - tag.x1) / self.frameWidth;
                        var relHeight = (tag.y2 - tag.y1) / self.frameHeight;
                        var relCenterX = (tag.x1 / self.frameWidth) + (relWidth / 2);
                        var relCenterY = (tag.y1 / self.frameHeight) + (relHeight / 2);

                        bboxesData += util.format('%s %s %s %s %s\n', classIndex, relCenterX.toFixed(6), 
                                               relCenterY.toFixed(6), relWidth.toFixed(6), relHeight.toFixed(6));
                    }
                    fs.writeFile(imageDataFilePath, bboxesData, cb);
                },
                function updateFilesList(cb) {
                    var lineToAppend = 'data/' + self.dataSetName + '/' + frameFileName + '\n';
                    if (self.testFrameIndecies.includes(self.posFrameIndex)){
                        self.posFrameIndex++;
                        fs.appendFile(self.testFilePath, lineToAppend, cb);
                    } else {
                        self.posFrameIndex++;
                        fs.appendFile(self.trainFilePath, lineToAppend, cb);
                    }
                }
            ],
            function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }

    // code snippet used from: 
    // http://stackoverflow.com/questions/21194934/node-how-to-create-a-directory-if-doesnt-exist
    function ensureDirExists(path, cb) {
        fs.mkdir(path, 0777, (err) => {
            if (err) {
                if (err.code == 'EEXIST') { 
                    return cb(); // ignore the error if the folder already exists
                }
                return cb(err);
            }
            cb();
        });
    }

    function deleteFileIfExists(path, cb) {
        fs.unlink(path, (err) => {
            if (err) {
                if (err.code == 'ENOENT') {
                    return cb();
                }
                return cb(err);
            }
            cb();
        });
    }

    //random set http://stackoverflow.com/questions/2380019/generate-unique-random-numbers-between-1-and-100 there has to be a set way of doing this
    function generateTestIndecies(percent, cb) {
       var testIndecies = [];
       while(testIndecies.length < Math.floor(percent * self.posFramesCount)){
            var randomnumber = Math.ceil(Math.random() * self.posFramesCount)
            if(testIndecies.indexOf(randomnumber) > -1) continue;
            testIndecies[testIndecies.length] = randomnumber;
        }
        cb(null, testIndecies);
    } 
}


exports.Exporter = Exporter;