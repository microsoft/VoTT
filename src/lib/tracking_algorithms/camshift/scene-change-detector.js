/*
Detects scene change based on the median color diference between detectionRegions on frames begining from 0,0 
Defaults at w:50, 50
*/

function SceneChangeDetector(options = {}) {  
    this._threshold = options.threshold || 110.418238983; // 25 * Math.sqrt(255 * 255 * 3) / 100
    this._detectionRegion = options.detectionRegion || {w:50,h:50};
    this._canvasContextImageDataLength =  (this._detectionRegion.w * this._detectionRegion.h *4);// The length of the canvas context imageData object. Used to speed up calculation.

    this.getDetectionRegion = function (){
        return this._detectionRegion;
    }

    //detects whether next frame is a scene change
    this.detectSceneChange = function(video, canvas, canvasContext, framerate) {
        var self = this;
        return new Promise((resolve, reject) => {
            var sceneChanged;
            var curFrame = canvasContext.getImageData(0, 0, canvas.width, canvas.height).data;
            var oldEvent = video.oncanplay; 
            video.oncanplay = isSceneChanged;
            video.currentTime += 1/framerate;

            function isSceneChanged() {
                if (sceneChanged != undefined){
                    video.oncanplay = oldEvent;
                    canvasContext.drawImage(video, 0, 0);
                    resolve(sceneChanged);
                } else {
                    canvasContext.drawImage(video, 0, 0);
                    var nxtFrame = canvasContext.getImageData(0, 0, canvas.width, canvas.height).data;
                    sceneChanged = self.detectChange(curFrame, nxtFrame);
                    video.currentTime -= 1/framerate;
                }
            }
        });
    }

    //detects whether region changes in the next frame (needs to be debugged for now resolve true)
    this.detectRegionChange = function(video, frameCanvas, region, index, framerate) {
        return new Promise((resolve, reject) => {
            try {
                var self = this;
                var canvas, canvasContext, curFrame, regionChanged;
                //clone local video and framecanvas since javascript does pass by reference
                var vid = video.cloneNode(true);
                vid.currentTime = video.currentTime;

                vid.oncanplay = init;
                function init (){
                    canvas = frameCanvas.cloneNode(true);
                    //put the first frame into the canvas  
                    canvasContext = canvas.getContext("2d");
                    canvasContext.drawImage(vid, 0, 0);
                    curFrame = canvasContext.getImageData(region.x, region.y, region.w, region.h).data;
                    //set up is region changed event
                    vid.oncanplay = isRegionChanged;
                    vid.currentTime += 1/framerate;
                }
                
                function isRegionChanged() {
                    if (regionChanged != undefined){
                        canvasContext.drawImage(vid, 0, 0);
                        resolve({regionChanged, region, index});
                    } else {
                        canvasContext.drawImage(vid, 0, 0);
                        var nxtFrame = canvasContext.getImageData(region.x, region.y, region.w, region.h).data;
                        regionChanged = self.detectChange(curFrame,nxtFrame);
                        vid.currentTime -= 1/framerate;
                    }
                }
            } catch (e){
                reject(e);
            }

        });
    }
    
    // detects change between two images 
    this.detectChange = function(lastImgData, currentImgData) {
        var diff = this.computeDifferences(lastImgData, currentImgData);
        if (diff > this._threshold) return true;
        return false;
    }

    //computes the median color diference between two images
    this.computeDifferences = function(colorsA, colorsB) {
        var colorDiffs = [];
        for (var i = 0; i < this._canvasContextImageDataLength; i = i + 4) {
            colorDiffs.push(this.getColorDistance(colorsA[i], colorsA[i + 1], colorsA[i + 2], colorsB[i], colorsB[i + 1], colorsB[i + 2]));
        }
        return this.getMedian(colorDiffs);
    }

    //calculates the euclidian color distance between two pixels
    this.getColorDistance = function(ra, ga, ba, rb, gb, bb) {
        return Math.sqrt((ra - rb) * (ra - rb) + (ga - gb) * (ga - gb) + (ba - bb) * (ba - bb));
    }

    //finds the median of an array
    this.getMedian = function(array) {
        if (!array.length) {return 0};
        var numbers = array.slice(0).sort((a,b) => a - b);
        var middle = Math.floor(numbers.length / 2);
        var isEven = numbers.length % 2 === 0;
        return isEven ? (numbers[middle] + numbers[middle - 1]) / 2 : numbers[middle];
    }

}