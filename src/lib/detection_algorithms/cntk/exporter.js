const async = require('async');
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

// The Exporter interface - provides a mean to export the tagged frames
// data in the expected data format of the detection algorithm
// Constructor parameters:
//  exportDirPath - path to the directory where the exported file will be placed
//  classes - list of classes supported by the tagged data
//  posFramesCount - number of positive tagged frames
//  frameWidth - The width (in pixels) of the image frame
//  frameHeight - The height (in pixels) of the image frame
//  testSplit - the percent of tragged frames to reserve for test set defaults to 20%
function Exporter(exportDirPath, classes, posFramesCount, frameWidth, frameHeight, testSplit) {
    var self = this;
    self.exportDirPath = exportDirPath;
    self.posDirPath  = path.join(self.exportDirPath, 'positive');
    self.negDirPath  = path.join(self.exportDirPath, 'negative');
    self.testDirPath = path.join(self.exportDirPath, 'testImages');
    self.classes = classes;
    self.posFramesCount = posFramesCount;
    self.frameWidth = frameWidth;
    self.frameHeight = frameHeight;
    self.testSplit = testSplit || 0.2;
    self.posFrameIndex = null;
    self.testFrameIndecies = null;

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
                rimraf.bind(null, self.exportDirPath),
                ensureDirExists.bind(null, self.exportDirPath),
                ensureDirExists.bind(null, self.posDirPath),
                ensureDirExists.bind(null, self.negDirPath),
                ensureDirExists.bind(null, self.testDirPath)
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
                function determineWritePath(cb){
                    if( !tags || (Object.keys(tags).length === 0 && tags.constructor === Object)){ 
                        cb(null, self.negDirPath);
                    } else {
                         if (self.testFrameIndecies.includes(self.posFrameIndex)){
                             self.posFrameIndex++;
                             cb(null, self.testDirPath);
                         } else {
                             self.posFrameIndex++;
                             cb(null, self.posDirPath);
                         }
                    }
                },
                function saveImage(exportPath, cb) {
                    var imageFilePath  = path.join(exportPath, frameFileName);
                    fs.writeFileSync(imageFilePath, frameBuffer);
                    cb(null, exportPath); 
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
                        var labelFilePath  = path.join(exportPath, `${frameFileName}.bboxes.labels.tsv`);
                        var bboxesFilePath  = path.join(exportPath, `${frameFileName}.bboxes.tsv`);
                        fs.writeFileSync(labelFilePath, labelData);
                        fs.writeFileSync(bboxesFilePath, bboxesData);
                    } 
                    cb();
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

}

exports.Exporter = Exporter;