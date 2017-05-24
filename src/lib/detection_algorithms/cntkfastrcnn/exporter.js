const async = require('async');
const fs = require('fs');
const path = require('path');
const detectionUtils = require('../detectionUtils.js');

// The Exporter interface - provides a mean to export the tagged frames
// data in the expected data format of the detection algorithm
// Constructor parameters:
//  exportDirPath - path to the directory where the exported file will be placed
//  classes - list of classes supported by the tagged data
//  taggedFramesCount - number of positive tagged frames
//  frameWidth - The width (in pixels) of the image frame
//  frameHeight - The height (in pixels) of the image frame
//  testSplit - the percent of tragged frames to reserve for test set defaults to 20%
function Exporter(exportDirPath, classes, taggedFramesCount, frameWidth, frameHeight, testSplit) {
    var self = this;
    self.exportDirPath = exportDirPath;
    self.posDirPath  = path.join(self.exportDirPath, 'positive');
    self.negDirPath  = path.join(self.exportDirPath, 'negative');
    self.testDirPath = path.join(self.exportDirPath, 'testImages');
    self.classes = classes;
    self.taggedFramesCount = taggedFramesCount;
    self.frameWidth = frameWidth;
    self.frameHeight = frameHeight;
    self.testSplit = testSplit || 0.2;
    self.posFrameIndex = null;
    self.testFrameIndecies = null;

    // Prepare everything for exporting (e.g. create metadata files,
    // directories, ..)    
    // Returns: A Promise object that resolves when the operation completes
    this.init = function init() {
         self.posFrameIndex = 0;
         self.testFrameIndecies = detectionUtils.generateTestIndecies(self.testSplit, taggedFramesCount);
         return new Promise((resolve, reject) => {
            async.eachSeries([self.exportDirPath, self.posDirPath, self.negDirPath, self.testDirPath], detectionUtils.ensureDirExists, (err) => {
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
        return new Promise((resolve, reject) => {
            var frameName = path.parse(frameFileName).name;
            async.waterfall(
              [
                async.each.bind(null,[path.join(self.posDirPath,  frameFileName), 
                                      path.join(self.negDirPath,  frameFileName), 
                                      path.join(self.testDirPath, frameFileName),
                                      path.join(self.posDirPath,  `${frameName}.bboxes.tsv`),
                                      path.join(self.testDirPath, `${frameName}.bboxes.tsv`),
                                      path.join(self.posDirPath,  `${frameName}.bboxes.labels.tsv`), 
                                      path.join(self.testDirPath, `${frameName}.bboxes.labels.tsv`)], detectionUtils.deleteFileIfExists),

                function determineWritePath(cb){
                    if(!tags.length){ 
                        cb(null, self.negDirPath);
                    } else {
                        var dirPath = self.testFrameIndecies.includes(self.posFrameIndex) ? self.testDirPath : self.posDirPath;
                        self.posFrameIndex++;
                        cb(null, dirPath);
                    }
                },
                function saveImage(exportPath, cb) {
                    var imageFilePath  = path.join(exportPath, frameFileName);
                    fs.writeFile(imageFilePath, frameBuffer, (err) => {
                        cb(err, exportPath);
                    });
                },
                function saveBboxes(exportPath, cb) {
                    if (exportPath !== self.negDirPath){
                        var labelData = '';
                        var bboxesData = '';
                        for (var i in tags) {
                            var tag = tags[i];
                            labelData  += `${tag.class}\n`;
                            bboxesData += `${tag.x1}\t${tag.y1}\t${tag.x2}\t${tag.y2}\n`;
                        }
                        var metadata = [
                            {data: bboxesData, filepath : path.join(exportPath, `${frameName}.bboxes.tsv`)},                            
                            {data: labelData, filepath : path.join(exportPath, `${frameName}.bboxes.labels.tsv`)}
                        ]
                        async.map(metadata, (obj, cb) => {
                            fs.writeFile(obj.filepath, obj.data, cb);
                        }, cb);
                    } else {
                        cb();
                    }
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