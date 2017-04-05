//read from config to find detection algorthims and paths
const path = require('path');
const fs = require('fs');
const detection_algorithms_path = path.join(__dirname,'../detection_algorithms');
const detection_algorithms_dirs = fs.readdirSync(detection_algorithms_path)
                                    .filter(file => (fs.statSync(path.join(detection_algorithms_path, file)).isDirectory()));

var detection_modules = {};

detection_algorithms_dirs.forEach((dir) => {
    var dm = require(path.join(detection_algorithms_path, dir));
    if (dm.displayName) {
        detection_modules[dm.displayName] = dm;
    }
});

function DetectionAlgorithmManager() {
    var self = this;
    //this returns a list of the availble detection modules
    this.getAvailbleAlgorthims = function getAvailbleAlgorthims() {
        return Object.keys(detection_modules);
    },

    //Set the  exporter to the specified detection module
    this.initExporter = function(algorithm, exportDirPath, classes, posFramesCount, frameWidth, frameHeight, testSplit, cb) {
         var exporter = new detection_modules[algorithm].Exporter(exportDirPath, classes, posFramesCount, frameWidth, frameHeight, testSplit);
         exporter.init().then(()=> {
             return cb(null, exporter.exportFrame);         
         }).catch((err) =>{
            return cb(err);
         });
    },

    this.initReviewer = function (algorithm, modelPath, cb) {
        var reviewer = new detection_modules[algorithm].Reviewer(modelPath);
        return cb(reviewer.reviewImagesFolder);
    }

}

module.exports.DetectionAlgorithmManager = DetectionAlgorithmManager;