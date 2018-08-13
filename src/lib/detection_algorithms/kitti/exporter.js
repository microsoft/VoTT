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
    self.trainDirPath = path.join(self.exportDirPath, 'train');
    self.trainImagesDirPath = path.join(self.trainDirPath, 'images');
    self.trainLabelsDirPath = path.join(self.trainDirPath, 'labels');
    self.validDirPath = path.join(self.exportDirPath, 'val');
    self.validImagesDirPath = path.join(self.validDirPath, 'images');
    self.validLabelsDirPath = path.join(self.validDirPath, 'labels');
    self.classes = classes;
    self.taggedFramesCount = taggedFramesCount;
    self.frameWidth = frameWidth;
    self.frameHeight = frameHeight;
    self.testFrameIndices = null;
    self.testFrameNames = null;
    self.posFrameLabelIndex = null;
    self.posFrameImageIndex = null;
    self.testSplit = testSplit || 0.2;

    // Prepare everything for exporting (e.g. create metadata files,
    // directories, ..)    
    // Returns: A Promise object that resolves when the operation completes
    this.init = function init() {
        self.posFrameLabelIndex = 0;
        self.posFrameImageIndex = 0;
        self.testFrameNames = [];
        self.testFrameIndices = detectionUtils.generateTestIndecies(self.testSplit, taggedFramesCount);
        self.filesTouched = {};  // Keep track of files we've touched so far
        return new Promise((resolve, reject) => {
            async.waterfall([
                detectionUtils.ensureDirExists.bind(null, self.exportDirPath),
                detectionUtils.ensureDirExists.bind(null, self.trainDirPath),
                detectionUtils.ensureDirExists.bind(null, self.trainImagesDirPath),
                detectionUtils.ensureDirExists.bind(null, self.trainLabelsDirPath),
                detectionUtils.ensureDirExists.bind(null, self.validDirPath),
                detectionUtils.ensureDirExists.bind(null, self.validImagesDirPath),
                detectionUtils.ensureDirExists.bind(null, self.validLabelsDirPath),
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
    //         Where (x1, y1) and (x2, y2) are the coordinates of the top left and bottom right corner
    //         and w, h are optional overloads for the frame demensions of the bounding boxes (respectively)
    //         and 'class' is the name of the class
    // Returns: A Promise object that resolves when the operation completes
    this.exportFrame = function exportFrame(frameFileName, frameBuffer, tags) {
        return new Promise((resolve, reject) => {
            async.waterfall([
                detectionUtils.ensureDirExists.bind(null, self.trainImagesDirPath),
                detectionUtils.ensureDirExists.bind(null, self.trainLabelsDirPath),
                detectionUtils.ensureDirExists.bind(null, self.validImagesDirPath),
                detectionUtils.ensureDirExists.bind(null, self.validLabelsDirPath),
                function saveImage(cb) {
                    var isTestFrame = (self.testFrameIndices.includes(self.posFrameImageIndex));
                    var outputDirPath = (isTestFrame ? self.validImagesDirPath : self.trainImagesDirPath)
                    var imageFilePath = path.join(outputDirPath, frameFileName);
                    fs.writeFile(imageFilePath, frameBuffer, cb);
                    self.posFrameImageIndex++;
                    if(isTestFrame) {
                        self.testFrameNames.push(frameFileName);
                    }
                },
                function saveLabel(cb) {
                    var isTestFrame = (self.testFrameNames.includes(frameFileName));
                    var outputDirPath = (isTestFrame ? self.validLabelsDirPath : self.trainLabelsDirPath);
                    var labelFileName = path.parse(frameFileName).name + '.txt';
                    var labelFilePath = path.join(outputDirPath, labelFileName);
                    var labelData = '';
                    for (var i in tags) {
                        if (i > 0) {
                            labelData += '\n';
                        }
                        var tag = tags[i];
                        var type = tag.class
                        var truncated = 0
                        var occluded = 0
                        var alpha = 0
                        var bbox = [tag.x1, tag.y1, tag.x2, tag.y2];
                        var dimensions = [0, 0, 0]
                        var location = [0, 0, 0]
                        var rotation_y = 0
                        labelData += util.format('%s %s %s %s %s %s %s %s %s %s %s %s %s %s %s',
                                                 type, truncated.toFixed(1), occluded, alpha.toFixed(1),
                                                 bbox[0].toFixed(2), bbox[1].toFixed(2), bbox[2].toFixed(2), bbox[3].toFixed(2),
                                                 dimensions[0].toFixed(1), dimensions[1].toFixed(1), dimensions[2].toFixed(1),
                                                 location[0].toFixed(1), location[1].toFixed(1), location[2].toFixed(1),
                                                 rotation_y.toFixed(1));
                    }
                    fs.writeFile(labelFilePath, labelData, cb);
                    self.posFrameLabelIndex++;
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
}

exports.Exporter = Exporter;
