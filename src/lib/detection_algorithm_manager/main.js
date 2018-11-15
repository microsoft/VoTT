//read from config to find detection algorthims and paths
const path = require('path');
const fs = require('fs');
const detection_algorithms_path = path.join(__dirname,'../detection_algorithms');
const detection_algorithms_dirs = fs.readdirSync(detection_algorithms_path)
                                    .filter(file => (fs.statSync(path.join(detection_algorithms_path, file)).isDirectory()));

var review_modules = {};
var export_modules = {};

detection_algorithms_dirs.forEach((dir) => {
    var dm = require(path.join(detection_algorithms_path, dir));
    if (dm.displayName) {
        if (dm.Reviewer){
            review_modules[dm.displayName] = dm;
        }
        if (dm.Exporter){
            export_modules[dm.displayName] = dm;
        }
    }
});

function DetectionAlgorithmManager() {
    var self = this;
    //this returns a list of the availble detection modules
    this.getAvailbleReviewers = function getAvailbleReviewers() {
        return Object.keys(review_modules);
    },
    this.getAvailbleExporters = function getAvailbleExporters() {
        return Object.keys(export_modules);
    },

    //Set the  exporter to the specified detection module
    this.initExporter = function(algorithm, exportDirPath, classes, posFramesCount, frameWidth, frameHeight, testSplit, cb) {
         var exporter = new export_modules[algorithm].Exporter(exportDirPath, classes, posFramesCount, frameWidth, frameHeight, testSplit);
         exporter.init().then(()=> {
             return cb(null, exporter.exportFrame);         
         }).catch((err) =>{
            return cb(err);
         });
    },

    this.initReviewer = function (algorithm, modelPath, cb) {
        var reviewer = new review_modules[algorithm].Reviewer(modelPath);
        return cb(reviewer.reviewImagesFolder);
    }

}

module.exports.DetectionAlgorithmManager = DetectionAlgorithmManager;