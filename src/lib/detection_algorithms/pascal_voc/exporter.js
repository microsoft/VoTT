const async = require('async');
const fs = require('fs');
const path = require('path');
const replace = require("replace");
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
    self.labelMap = path.join(self.exportDirPath,"pascal_label_map.pbtxt");
    self.annDirPath  = path.join(self.exportDirPath, 'Annotations');
    self.imgSetsDirPath  = path.join(self.exportDirPath, 'ImageSets');
    self.mainDirPath  = path.join(self.imgSetsDirPath, 'Main');
    self.jpgImgsDirPath = path.join(self.exportDirPath, 'JPEGImages');
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
            async.waterfall([
                async.eachSeries.bind(null,[self.exportDirPath, self.annDirPath, self.imgSetsDirPath, self.mainDirPath, self.jpgImgsDirPath], detectionUtils.ensureDirExists),
                detectionUtils.deleteFileIfExists.bind(null,self.labelMap),
                function generateLabelMap(cb){
                    var labelMapData = '';
                    classes.forEach((element,i)=> {
                        labelMapData += `item {\r\n id: ${i+1}\r\n name: '${element}'\r\n}\r\n`
                    });
                    fs.appendFile(self.labelMap, labelMapData, cb);
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
            var b64 = 'data:image/jpeg;base64,' + frameBuffer.toString('base64');
            var img = new Image(); 
            img.onload = function() {   
                async.waterfall(
                [
                    //clear old write
                    async.each.bind(null, [path.join(self.jpgImgsDirPath, frameFileName), `${path.join(self.annDirPath, frameFileName).slice(0, -4).replace('.','')}.xml`], detectionUtils.deleteFileIfExists),

                    function saveImage(cb) {
                        var imageFilePath  = path.join(self.jpgImgsDirPath, frameFileName);
                        fs.writeFile(imageFilePath, frameBuffer, (err) => {
                            cb(err);
                        });
                    },
                    function saveBboxes(cb) {
                        xmlData = `<annotation verified="yes">
                                    <folder>Annotation</folder>
                                    <filename>${frameFileName.slice(0, -4).replace('.','')}</filename>
                                    <path>${path.join(self.jpgImgsDirPath, frameFileName)}</path>
                                    <source>
                                        <database>Unknown</database>
                                    </source>
                                    <size>
                                        <width>${img.width}</width>
                                        <height>${img.height}</height>
                                        <depth>3</depth>
                                    </size\>
                                    <segmented>0</segmented>`;
                        for (var i in tags) {
                            var tag = tags[i];
                            xmlData += `
                                    <object>
                                            <name>${tag.class}</name>
                                            <pose>Unspecified</pose>
                                            <truncated>0</truncated>
                                            <difficult>0</difficult>
                                            <bndbox>
                                                <xmin>${tag.x1}</xmin>
                                                <ymin>${tag.y1}</ymin>
                                                <xmax>${tag.x2}</xmax>
                                                <ymax>${tag.y2}</ymax>
                                            </bndbox>
                                    </object>
                                    `
                        }
                        xmlData += '</annotation\>'
                        var outpath = `${path.join(self.annDirPath, frameFileName).slice(0, -4).replace('.','')}.xml`
                        fs.writeFile(outpath, xmlData, cb);                 
                    }, 
                    function cleanOldMainData(cb){
                        replace({  
                            regex: new RegExp(`^${frameFileName.slice(0, -4).replace('.','')}+(.*)\s*[\r\n]`,'m'),
                            replacement: "",
                            paths: [self.mainDirPath],
                            recursive: true,
                            silent: true,
                        })
                        cb();
                    },
                    function generateMainData(cb){
                        var tagsClassSet = new Set([]);
                        outs = [];// come up with better name for this var
                        for (var i in tags) { 
                            tagsClassSet.add(tags[i].class)
                        }
                        self.classes.forEach(function (element){
                            var classPath = path.join(self.mainDirPath, element);
                            // determine wheter to write to train or test path
                            var outPath = self.testFrameIndecies.includes(self.posFrameIndex) ? `${classPath}_val.txt` : `${classPath}_train.txt`;
                            var line = tagsClassSet.has(element) ? `${frameFileName.slice(0, -4).replace('.','')} 1\r\n` : `${frameFileName.slice(0, -4).replace('.','')} -1\r\n` ;
                            outs.push({'outPath':outPath, 'line':line});
                        });
                        async.each(outs, (out, callback)=>{
                            fs.appendFile(out.outPath, out.line, callback);
                        }, cb);
                        self.posFrameIndex++;
                    }
                ], (err) => {
                    if (err) {
                        return reject(err);
                    }
                    return resolve();
                });
            }
            img.src = b64;
        });
    }       

}

exports.Exporter = Exporter;