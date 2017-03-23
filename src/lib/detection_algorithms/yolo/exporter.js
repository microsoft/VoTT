const async = require('async');
const fs = require('fs');
const path = require('path');
const util = require('util');

const DEFAULT_DATA_SET_NAME = "obj"
const CFG_TEMPLATE_FILE_PATH = path.join(__dirname, 'yolo-obj.cfg.template');

const OBJ_DATA_TAMPLATE = 'classes = %s\n' + 
                          'train  = train.txt\n' +
                          'valid  = test.txt\n' +
                          'names = %s.names' +
                          'backup = backup/'



// The Exporter interface - provides a mean to export the tagged frames
// data in the expected data format of the detection algorithm
// Constructor parameters:
//  exportDirPath - path to the directory where the exported file will be placed
//  classes - list of classes supported by the tagged data
//  frameWidth - The width (in pixels) of the image frame
//  frameHeight - The height (in pixels) of the image frame
function Exporter(exportDirPath, classes, frameWidth, frameHeight) {
    var self = this;
    self.dataSetName = DEFAULT_DATA_SET_NAME;
    self.exportDirPath = exportDirPath;
    self.classes = classes;
    self.frameWidth = frameWidth;
    self.frameHeight;
    self.cfgTemplate = null;
    // Prepare everything for exporting (e.g. create metadata files,
    // directories, ..)    
    // Returns: A Promise object that resolves when the operation completes
    this.init = function init() {
        return new Promise(function(resolve, reject) {
            async.waterfall([
                function getTemplate(cb) {
                    if (self.cfgTemplate) {
                        return cb();
                    }
                    fs.readFile(CFG_TEMPLATE_FILE_PATH, (err, data) => {
                        if (err) {
                            return cb(err)
                        }
                        self.cfgTemplate = data;
                        cb();
                    })
                },
                function saveCfg(cb) {
                    // replace the placeholders
                    var filtersCount = (self.classes.length + 5) * 5;
                    var cfg = util.format(self.cfgTemplate, filtersCount, self.classes.length);
                    fs.writeFile(path.join(self.exportDirPath, 'yolo-' + self.dataSetName +'.cfg'), cfg, cb);
                },
                function saveObjectNames(cb) {
                    var objectNames = '';
                    for (var i in self.classes) {
                        objectNames += self.classes[i] + "\n";
                    }
                    fs.writeFile(path.join(self.exportDirPath, self.dataSetName + '.names'), objectNames, cb)
                },
                function saveObjectData(cb) {
                    var objectData = util.format(OBJ_DATA_TAMPLATE, self.classes.length, self.dataSetName);
                    fs.writeFile(path.join(self.exportDirPath, self.dataSetName + '.data'), objectData, cb);
                }
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
    //  tags - a list of tags / classes (in strings) corresponding to the list
    //        of bounding boxes
    // Returns: A Promise object that resolves when the operation completes
    this.exportFrame = function exportFrame(frameFileName, frameBuffer, bboxes, tags) {
        return new Promise(function(resolve, reject) {
            async.waterfall([
                function createDataDir(cb) {

                },
                function saveImage(cb) {
                    //var imageFilePath = 
                },
                function saveBBoxesData(cb) {

                },
                function updateFilesList(cb) {

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
}


exports.Exporter = Exporter;