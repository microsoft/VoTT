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
    self.dataDirPath = path.join(self.exportDirPath, 'data');
    self.imagesDirPath = path.join(self.dataDirPath, self.dataSetName);
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
                ensureDirExists.bind(null, self.dataDirPath),
                function saveObjectNames(cb) {
                    var objectNames = '';
                    for (var i in self.classes) {
                        objectNames += self.classes[i] + "\n";
                    }
                    fs.writeFile(path.join(self.dataDirPath, self.dataSetName + '.names'), objectNames, cb)
                },
                function saveObjectData(cb) {
                    var objectData = util.format(OBJ_DATA_TAMPLATE, self.classes.length, self.dataSetName);
                    fs.writeFile(path.join(self.dataDirPath, self.dataSetName + '.data'), objectData, cb);
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
    //  tags - a list of objects containing the tagging data. Each object is in the format of:
    //         {'x1' : int, 'y1' : int, 'x2' : int, 'y2' : int, 'class' : string}
    //         Where (x1,y1) and (x2,y2) are the coordinates of the top left and bottom right corner
    //         of the bounding boxes (respectively), and 'class' is the name of the class.
    // Returns: A Promise object that resolves when the operation completes
    this.exportFrame = function exportFrame(frameFileName, frameBuffer, tags) {

        /*
        Put image-files (.jpg) of your objects in the directory build\darknet\x64\data\obj\

            Create .txt-file for each .jpg-image-file - in the same directory and with the same name, but with .txt-extension, and put to file: object number and object coordinates on this image, for each object in new line: <object-class> <x> <y> <width> <height>

            Where:

            <object-class> - integer number of object from 0 to (classes-1)
            <x> <y> <width> <height> - float values relative to width and height of image, it can be equal from 0.0 to 1.0
            for example: <x> = <absolute_x> / <image_width> or <height> = <absolute_height> / <image_height>
            atention: <x> <y> - are center of rectangle (are not top-left corner)
            For example for img1.jpg you should create img1.txt containing:

            1 0.716797 0.395833 0.216406 0.147222
            0 0.687109 0.379167 0.255469 0.158333
            1 0.420312 0.395833 0.140625 0.166667
            Create file train.txt in directory build\darknet\x64\data\, with filenames of your images, each filename in new line, with path relative to darknet.exe, for example containing:
            data/obj/img1.jpg
            data/obj/img2.jpg
            data/obj/img3.jpg
        */

        return new Promise(function(resolve, reject) {
            async.waterfall([
                ensureDirExists.bind(null, self.imagesDirPath),
                function saveImage(cb) {
                    var imageFilePath = path.join(self.imagesDirPath, frameFileName);
                    fs.writeFile(imageFilePath, frameBuffer, cb); 
                },
                function saveBBoxesData(cb) {
                    imageDataFilePath = path.join(self.imagesDirPath, frameFileName + ".txt");
                    var bboxesData = '';
                    for 
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
}


exports.Exporter = Exporter;