// An model reviewer class that provides functionality to review images using the model
// Constructor parameters:
//  modelPath - Path to the model file 
function Reviewer(modelPath) {
    self = this;
    self.modelPath = modelPath;
    
    // Reviews a folder of images using the model
    // Parameters:
    //  imagesFolderPath - The path of the images folder
    // Returns: A Promise object that resolves when the operation completes
    // The result object of the detection operation will contain the possible classes for the detected 
    // objects (with class names and class numeric ids), and for each image in the directory it will 
    // contain the list of regions that were detected. Each region will have its boundaries and detected
    // class.
    // For example, for an invocation of the method with  model that predicts boxes for the classes 
    // "human", "dog", and "cat", on a directory that contains 2 images (named '1.jpg' and '2.jpg')
    // The output object will be:
    // {
	//  "frames": {
	// 	    "1.jpg": {
	// 		    "regions": [
	// 			    {
	// 				    "class": 1,
	//  				"x1": 418,
	//  				"x2": 538,
	//  				"y2": 179,
	//  				"y1": 59
	//  			}
	//  		]
	//  	},
	//  	"2.jpg": {
	//  		"regions": [
	//  			{
	//  				"class": 2,
	//  				"x1": 478,
	//  				"x2": 597,
	//  				"y2": 298,
	//  				"y1": 59
	//  			}
	//  		]
	//  	}
	//  },
	//  "classes": {
	//  	    "background" : 0,
	//  	    "human": 1,
	//  	    "cat": 2,
	//  	    "dog" : 3
	//      }
    // }
    this.reviewImagesFolder = function reviewImagesFolder(imagesFolderPath) {
    }
}


exports.Reviewer = Reviewer;