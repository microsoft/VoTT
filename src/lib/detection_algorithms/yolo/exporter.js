const async = require('async');
const fs = require('fs');
const path = require('path');
const util = require('util');
const detectionUtils = require('../detectionUtils.js');

const DEFAULT_DATA_SET_NAME = 'obj';
const CFG_TEMPLATE_FILE_PATH = path.join(__dirname, 'yolo-obj.cfg.template');

const OBJ_DATA_TEMPLATE = 'classes = %s\n' + 
                          'train  = data/train.txt\n' +
                          'valid  = data/test.txt\n' +
                          'names = data/%s.names\n' +
                          'backup = backup/'



// The Exporter interface - provides a mean to export the tagged frames
// data in the expected data format of the detection algorithm
// Constructor parameters:
//  exportDirPath - path to the directory where the exported file will be placed
//  classes - list of classes supported by the tagged data
//  taggedFramesCount - number of positive tagged frames
//  frameWidth - The width (in pixels) of the image frame
//  frameHeight - The height (in pixels) of the image frame
function Exporter(exportDirPath, classes, taggedFramesCount, frameWidth, frameHeight, testSplit) {
    var self = this;
    self.dataSetName = DEFAULT_DATA_SET_NAME;
    self.exportDirPath = exportDirPath;
    self.dataDirPath = path.join(self.exportDirPath, 'data');
    self.imagesDirPath = path.join(self.dataDirPath, self.dataSetName);
    self.trainFilePath = path.join(self.dataDirPath, 'train.txt');
    self.testFilePath = path.join(self.dataDirPath, 'test.txt');
    self.classes = classes;
    self.taggedFramesCount = taggedFramesCount;
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
        self.posFrameIndex = 0;
        self.testFrameIndecies = detectionUtils.generateTestIndecies(self.testSplit, taggedFramesCount);
        self.filesTouched = {};  // Keep track of files we've touched so far
        return new Promise((resolve, reject) => {
            async.waterfall([
                detectionUtils.ensureDirExists.bind(null, self.exportDirPath),
                async.each.bind(null,[self.trainFilePath, self.testFilePath], detectionUtils.deleteFileIfExists),
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
                detectionUtils.ensureDirExists.bind(null, self.dataDirPath),
                function saveObjectNames(cb) {
                    var objectNames = '';
                    for (var i in self.classes) {
                        objectNames += self.classes[i] + '\n';
                    }
                    fs.writeFile(path.join(self.dataDirPath, self.dataSetName + '.names'), objectNames, cb)
                },
                function saveObjectData(cb) {
                    var objectData = util.format(OBJ_DATA_TEMPLATE, self.classes.length, self.dataSetName);
                    fs.writeFile(path.join(self.dataDirPath, self.dataSetName + '.data'), objectData, cb);
                },
            ], (err) => {
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
    //         {'x1' : int, 'y1' : int, 'x2' : int, 'y2' : int, 'class' : string 'w': int, 'h' :int}
    //         Where (x1,y1) and (x2,y2) are the coordinates of the top left and bottom right corner and w an h are optional overloads for the frame demensions
    //         of the bounding boxes (respectively), and 'class' is the name of the class.
    // Returns: A Promise object that resolves when the operation completes
    this.exportFrame = function exportFrame(frameFileName, frameBuffer, tags) {
        return new Promise((resolve, reject) => {
            async.waterfall([
                detectionUtils.ensureDirExists.bind(null, self.imagesDirPath),
                function saveImage(cb) {
                    var imageFilePath = path.join(self.imagesDirPath, frameFileName);
                    fs.writeFile(imageFilePath, frameBuffer, cb); 
                },
                function saveBBoxesData(cb) {
                    imageDataFilePath = path.join(self.imagesDirPath, path.parse(frameFileName).name + '.txt');
                    var bboxesData = '';
                    for (var i in tags) {
                        if (i > 0) {
                            bboxesData += '\n';
                        }
                        var tag = tags[i];
                        var classIndex = self.classesDict[tag.class];
                        var relWidth = (tag.x2 - tag.x1) / (tag.w || self.frameWidth);
                        var relHeight = (tag.y2 - tag.y1) / (tag.h || self.frameHeight);
                        var relCenterX = (tag.x1 / (tag.w || self.frameWidth)) + (relWidth / 2);
                        var relCenterY = (tag.y1 / (tag.h || self.frameHeight)) + (relHeight / 2);
                        bboxesData += util.format('%s %s %s %s %s', classIndex, relCenterX.toFixed(6), 
                                               relCenterY.toFixed(6), relWidth.toFixed(6), relHeight.toFixed(6));
                    }
                    fs.writeFile(imageDataFilePath, bboxesData, cb);
                },
                function updateFilesList(cb) {
                    var lineToAppend = 'data/' + self.dataSetName + '/' + frameFileName;
                    var isTestFrame = (self.testFrameIndecies.includes(self.posFrameIndex));
                    var filePath = (isTestFrame ? self.testFilePath : self.trainFilePath);
                    if (self.filesTouched[filePath]) {
                        // If we have written to this file previously, we need to add a newline
                        lineToAppend = '\n' + lineToAppend;
                    }
                    self.filesTouched[filePath] = true;  // Mark that we need to add a newline when writing more
                    self.posFrameIndex++;
                    fs.appendFile(filePath, lineToAppend, cb);
                }
            ], (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }
}

exports.Exporter = Exporter;
