//read from config to find detection algorthims and paths
const path = require('path');
const config_path = path.join(__dirname, 'config.json')
const config = require(config_path);

//load detection modules
var detection_modules = {}
Object.keys(config).forEach((module_path) => {
    detection_modules[config[module_path]] =  require(path.join(__dirname, module_path));
});

function DetectionAlgorithmManager() {
    var exporter, reviewer, export_algorithm, review_algorthim;
    //this returns a list of the availble detection modules
    this.getAvailbleAlgorthims = function() {
        return Object.keys(detection_modules);
    },

    //returns export detection algorithm
    this.getCurrentExportAlgorithm = function() {
        return export_algorithm;
    },

    //returns current review algorithm
    this.getCurrentExportAlgorithm = function() {
        return review_algorthim;
    },


    //Set the  exporter to the specified detection module
    this.setExporter = function(algorithm, exportDirPath, classes, posFramesCount, frameWidth, frameHeight, testSplit) {
         if (!this.getAvailbleAlgorthims().includes(algorithm)){
             throw (`Error ${algorithm} module is not recognized`);
         }
         this.exporter = new detection_modules[algorithm].Exporter(exportDirPath, classes, posFramesCount, frameWidth, frameHeight, testSplit);
         this.export_algorithm = algorithm;
    },

    //Set the reviewer for to the specified detection module
    this.setReviewer = function(algorithm, modelPath, imagesFolderPath) {
        if (!this.getAvailbleAlgorthims().includes(algorithm)){
             throw (`Error ${algorithm} module is not recognized`);
        }
        this.reviewer = new detection_modules[algorithm].Reviewer(modelPath);
        this.review_algorthim = algorithm;
    }

}

module.exports.DetectionAlgorithmManager = DetectionAlgorithmManager;