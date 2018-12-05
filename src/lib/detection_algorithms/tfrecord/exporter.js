const async = require('async');
const fs = require('fs');
const path = require('path');
const replace = require("replace");
const detectionUtils = require('../detectionUtils.js');
const tfrecord = require('tfrecord');
const CryptoJS = require("crypto-js");

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
    self.labelMap = path.join(self.exportDirPath,"tf_label_map.pbtxt");
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
                async.eachSeries.bind(null,[self.exportDirPath], detectionUtils.ensureDirExists),
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
            var frameName = path.parse(frameFileName).base;
            var b64 = frameBuffer.toString('base64');
            async.waterfall([
                function buildRecord(cb) {
                    const builder = tfrecord.createBuilder();

                    let xmin = [];
                    let ymin = [];
                    let xmax = [];
                    let ymax = [];
                    let classes = [];
                    let difficult_obj = [];
                    let truncated = [];
                    let poses = [];

                    tags.forEach(tag => {
                        xmin.push(tag.x1 / tag.w)
                        ymin.push(tag.y1 / tag.h)
                        xmax.push(tag.x2 / tag.w)
                        ymax.push(tag.y2 / tag.h)
                        classes.push(tag.class)
                        difficult_obj.push(0)
                        truncated.push(0)
                        poses.push(encode_Uint8("Unspecified"))
                    });
                    if(tags.length){
                        builder.setIntegers('image/height', [tags[0].h]);
                        builder.setIntegers('image/width', [tags[0].w]);
                    } else {
                        builder.setIntegers('image/height', [self.frameHeight]);
                        builder.setIntegers('image/width', [self.frameWidth]);
                    }
                    

                    builder.setBinaries('image/filename', [encode_Uint8(frameName)]);
                    builder.setBinaries('image/source_id', [encode_Uint8(frameName)]);

                    builder.setBinaries('image/key/sha256', [encode_Uint8(CryptoJS.SHA256(b64).toString(CryptoJS.enc.Base64))]);

                    builder.setBinaries('image/encoded', [b64]);

                    if (videotagging.currTFRecord) {
                        builder.setBytes('image/format', [encode_Uint8(videotagging.getCurrentFrameId().split(".").slice(-2)[0])]);
                    } else if(videotagging.imagelist){
                        builder.setBinaries('image/format', [encode_Uint8(videotagging.getCurrentFrameId().split(".").slice(-1)[0])]);
                    } else {
                        builder.setBinaries('image/format', [encode_Uint8('mp4')]);
                    }

                    
                    builder.setFloats('image/object/bbox/xmin', xmin);
                    builder.setFloats('image/object/bbox/ymin', ymin);
                    builder.setFloats('image/object/bbox/xmax', xmax);
                    builder.setFloats('image/object/bbox/ymax', ymax);
                    builder.setBinaries('image/object/class/text', classes.map(tag => encode_Uint8(tag)));
                    builder.setIntegers('image/object/class/label', classes.map(tag => videotagging.inputtagsarray.indexOf(tag)));

                    builder.setIntegers('image/object/difficult', difficult_obj);
                    builder.setIntegers('image/object/truncated', truncated);
                    builder.setBinaries('image/object/view', poses);

                    example = builder.releaseExample();

                    console.log('new example built')
                    cb(null,example);
                },
                async function writeRecord(example){
                    let outputPath = self.exportDirPath + path.sep + frameName + '.tfrecord';

                    const writer = await tfrecord.createWriter(outputPath);
                    await writer.writeExample(example);
                    await writer.close();
                }
            ], (err) => {
                if (err) {
                    return reject(err);
                }
                return resolve();
            });
        });
    }       

}

exports.Exporter = Exporter;