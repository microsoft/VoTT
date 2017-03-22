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
    this.reviewImagesFolder = function reviewImagesFolder(imagesFolderPath) {
    }
}


exports.Reviewer = Reviewer;