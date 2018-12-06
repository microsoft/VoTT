const async = require('async');
const fs = require('fs');
const path = require('path');
const detectionUtils = require('../detectionUtils.js');


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
    self.classes = classes;
    self.posFramesCount = posFramesCount;
    self.frameWidth = frameWidth;
    self.frameHeight = frameHeight;

    // Prepare everything for exporting (e.g. create metadata files,
    // directories, ..)    
    // Returns: A Promise object that resolves when the operation completes
    this.init = function init() {
        self.imagesPath  = path.join(self.exportDirPath, 'Images');
        self.annotationPath = path.join(self.exportDirPath, 'annotations.csv');
        self.classesPath = path.join(self.exportDirPath, 'classes.csv');
        return new Promise((resolve, reject) => {
            // write a csv file
            csv_classes = '';
            for (var i in self.classes) {
                csv_classes += `${self.classes[i]},${i}\n`;   
            }
            detectionUtils.ensureDirExists(self.exportDirPath, (err) => {
                detectionUtils.ensureDirExists(self.imagesPath, (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    fs.writeFile(self.classesPath, csv_classes, (err) => {  
                        // throws an error, you could also catch it here
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve();
                    });
            
                });
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

        // save image file 
        // append annotation line to annotations csv

        return new Promise((resolve, reject) => {
            var frameName = path.parse(frameFileName).name;
            async.waterfall(
              [
                function saveImage(cb) {
                    var imageFilePath  = path.join(self.imagesPath, frameFileName);
                    fs.writeFile(imageFilePath, frameBuffer, (err) => {
                        cb(err);
                    });
                },
                function saveBboxes(cb) {
                    var csv_data = '';
                    var imageFilePath  = path.join(self.imagesPath, frameFileName);

                    if (tags === undefined || tags.length == 0) {
                        csv_data += `${imageFilePath},,,,,\n`
                    } else {
                        for (var i in tags) {
                            var tag = tags[i];
                            csv_data += `${imageFilePath},${tag.x1},${tag.y1},${tag.x2},${tag.y2},${tag.class}\n`
                        }
                    }

                    fs.appendFile(self.annotationPath, csv_data, cb);
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