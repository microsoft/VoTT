//read from config to find detection algorthims and paths
const path = require('path');
const config_path = path.join(__dirname, 'config.json')
const config = require(config_path);

//load detection modules
var detection_modules = {}
Object.keys(config).forEach((key) => {
    detection_modules[key] =  require(path.join(__dirname, config[key]));
});

function DetectionAlgorithmManager() {
    var self = this;
    //this returns a list of the availble detection modules
    this.getAvailbleAlgorthims = function getAvailbleAlgorthims() {
        return Object.keys(config);
    },

    //Set the  exporter to the specified detection module
    this.initExporter = function(algorithm, exportDirPath, classes, posFramesCount, frameWidth, frameHeight, testSplit, cb) {
         if (!Object.keys(config).includes(algorithm)){
             throw (`Error ${algorithm} module is not recognized`);
         }
         var exporter = new detection_modules[algorithm].Exporter(exportDirPath, classes, posFramesCount, frameWidth, frameHeight, testSplit);
         exporter.init().then(()=> {
             return cb(null, exporter.exportFrame);         
         }).catch((err) =>{
            return cb(err);
         });
    },

    this.initReviewer = function (algorithm, modelPath, cb) {
        if (!Object.values(config).includes(algorithm)){
             throw (`Error ${algorithm} module is not recognized`);
        }
        var reviewer = new detection_modules[algorithm].Reviewer(modelPath);
        return cb(reviewer.reviewImagesFolder);
    }

}

module.exports.DetectionAlgorithmManager = DetectionAlgorithmManager;