const fs = require('fs');
const path = require('path');

// The Exporter interface - provides a mean to export the tagged frames
// data in the expected data format of the detection algorithm
// Constructor parameters:
//  exportDirPath - path to the directory where the exported file will be placed
//  classes - list of classes supported by the tagged data
//  frameWidth - The width (in pixels) of the image frame
//  frameHeight - The height (in pixels) of the image frame
function Exporter(exportDirPath, classes, frameWidth, frameHeight) {
    var self = this;
    self.exportDirPath = exportDirPath;
    self.classes = classes;
    self.frameWidth = frameWidth;
    self.frameHeight;

    // Prepare everything for exporting (e.g. create metadata files,
    // directories, ..)    
    // Returns: A Promise object that resolves when the operation completes
    this.init = function init() {
    }

    // Export a single frame to the training data
    // Parameters:
    //  frameBuffer - A buffer with the frame image data 
    //  bboxes  - a list of bboxes in the format of x1, y1, x2, y2 where the
    //           coordinates are in absolute values of the image
    //  tags - a list of tags / classes (in strings) corresponding to the list
    //        of bounding boxes
    // Returns: A Promise object that resolves when the operation completes
    this.exportFrame = function exportFrame(frameBuffer, bboxes, tags) {
    }
}


exports.Exporter = Exporter;