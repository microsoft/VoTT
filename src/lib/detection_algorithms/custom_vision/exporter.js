const fs = require('fs');
const path = require('path');

// The Exporter interface - provides a mean to export the tagged frames
// data in the expected data format of the detection algorithm
// Constructor parameters:
//  exportDirPath - path to the directory where the exported file will be placed
//  classes - list of classes supported by the tagged data
//  posFramesCount - number of positive tagged frames
//  frameWidth - The width (in pixels) of the image frame
//  frameHeight - The height (in pixels) of the image frame
//  testSplit - the percent of tragged frames to reserve for test set defaults to 20%
function Exporter(exportDirPath, classes, posFramesCount, frameWidth, frameHeight, testSplit) {
    var self = this;
    self.projectId = "";
    self.trainingKey = exportDirPath;
    self.classes = classes;
    self.tagMap = {};
    self.posFramesCount = posFramesCount;
    self.frameWidth = frameWidth;
    self.frameHeight = frameHeight;
    self.testSplit = testSplit || 0.2;

    // Prepare everything for exporting (e.g. create metadata files,
    // directories, ..)    
    // Returns: A Promise object that resolves when the operation completes
    this.init = function init() {
        return new Promise((resolve, reject) => {
            // create new project (TBI add exisiting project option)
            var params = {
                // Request parameters
                "domainId": "DA2E3A8A-40A5-4171-82F4-58522F70FBC1"
            }
            fetch("https://southcentralus.api.cognitive.microsoft.com/customvision/v2.0/Training/projects?name=vott_export&"+ $.param(params), {
                method: 'post', headers: {
                    "Training-Key":self.trainingKey
                }
            }).then(response => response.json()
            ).then((data)=>{
                self.projectId = data.id;
                var promises = self.classes.map(tagName =>
                        fetch(`https://southcentralus.api.cognitive.microsoft.com/customvision/v2.0/Training/projects/${self.projectId}/tags?name=${tagName}`, {
                            method: 'post', headers: {
                                "Training-Key":self.trainingKey
                            }
                        }).then(res => res.json()
                        ).then((tagData)=>{
                            self.tagMap[tagData.name] = tagData.id;
                            console.log(`${tagData.id}:${tagData.name}`);
                        })
                );
                Promise.all(promises).then(()=>{
                    resolve();
                }).catch((err)=>{
                    reject(err);
                })
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
    //         {'x1' : int, 'y1' : int, 'x2' : int, 'y2' : int, 'class' : string 'w': int, 'h' :int}
    //         Where (x1,y1) and (x2,y2) are the coordinates of the top left and bottom right corner and w an h are optional overloads for the frame demensions
    //         of the bounding boxes (respectively), and 'class' is the name of the class.
    // Returns: A Promise object that resolves when the operation completes
    this.exportFrame = function exportFrame(frameFileName, frameBuffer, tags) {
        return new Promise((resolve, reject) => {       
            $(function() {
                request = {
                    url: `https://southcentralus.api.cognitive.microsoft.com/customvision/v2.0/Training/projects/${self.projectId}/images/files?`,
                    beforeSend: function(xhrObj){
                        // Request headers
                        xhrObj.setRequestHeader("Training-Key",self.trainingKey);
                        xhrObj.setRequestHeader("Content-Type","application/json");
                    },
                    type: "POST",
                    // Request body
                    data: JSON.stringify( {
                            "images": [
                            {
                                "name": frameFileName,
                                "contents": frameBuffer.toJSON().data,
                                "width": self.frameWidth,
                                "height": self.frameHeight,
                                "regions": tags.map((tag)=>{
                                    return {
                                        "tagId": self.tagMap[tag.class],
                                        "left": tag.x1/tag.w,
                                        "top": tag.y1/tag.h,
                                        "width": Math.abs(tag.x2 - tag.x1)/tag.w,
                                        "height": Math.abs(tag.y2 - tag.y1)/tag.h
                                    }
                                })
                            }]
                        }),
                }
                console.log(request);
            
                $.ajax(request)
                .done(function(data) {
                    resolve();
                })
                .fail(function(error) {
                    reject(error);
                });
            });
        });
    }
}

exports.Exporter = Exporter;