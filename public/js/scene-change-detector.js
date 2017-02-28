/*
Detects scene change based on the median color diference between detectionRegions on frames begining from 0,0 
Defaults at w:50, 50
*/

function SceneChangeDetector(options={}) {  
    this._threshold = options.threshold || 110.418238983; // 25 * Math.sqrt(255 * 255 * 3) / 100
    this._detectionRegion = options.detectionRegion || {w:50,h:50};
    this._canvasContextImageDataLength =  (this._detectionRegion.w * this._detectionRegion.h *4);// The length of the canvas context imageData object. Used to speed up calculation.

    this.getDetectionRegion = function (){
        return this._detectionRegion;
    }

    //detects whether next frame is a scene change
    this.detectSceneChange = function(video, canvas, canvasContext, framerate) {
        var self = this;
        var d = $.Deferred();
        var sceneChanged;
        var curFrame = canvasContext.getImageData(0, 0, canvas.width, canvas.height).data;
        video.addEventListener("canplaythrough", isSceneChanged);
        video.currentTime += 1/framerate;

        function isSceneChanged() {
            if (sceneChanged != undefined){
                video.removeEventListener("canplaythrough", isSceneChanged);
                canvasContext.drawImage(video, 0, 0);
                d.resolve(sceneChanged);
            } else {
                canvasContext.drawImage(video, 0, 0);
                var nxtFrame = canvasContext.getImageData(0, 0, canvas.width, canvas.height).data;
                sceneChanged = self.detectChange(curFrame, nxtFrame);
                video.currentTime -= 1/framerate;
            }
        }

        return d;
    }

    //detects whether region changes in the next frame (needs to be debugged for now resolve true)
    this.detectRegionChange = function(video, canvas, canvasContext, region, framerate) {
        var self = this;
        var d = $.Deferred();
        var regionChanged;
        var curFrame = canvasContext.getImageData(region.x, region.y, region.w, region.h).data;
        
        
        video.addEventListener("canplaythrough", isRegionChanged);
        video.currentTime += 1/framerate;
        
        function isRegionChanged() {
            if (regionChanged != undefined){
                video.removeEventListener("canplaythrough", isRegionChanged);
                canvasContext.drawImage(video, 0, 0);
                d.resolve(regionChanged);
            } else {
                canvasContext.drawImage(video, 0, 0);
                var nxtFrame = canvasContext.getImageData(region.x, region.y, region.w, region.h).data;
                regionChanged = self.detectChange(curFrame, nxtFrame);
                video.currentTime -= 1/framerate;
            }
        }

        return d;
    }


    this.detectChange = function(lastImgData, currentImgData) {
        var diff = this.computeDifferences(lastImgData, currentImgData);
        if (diff > this._threshold) return true;
        return false;
    }

    this.computeDifferences = function(colorsA, colorsB) {
        var colorDiffs = [];
        for (var i = 0; i < this._canvasContextImageDataLength; i = i + 4) {
            colorDiffs.push(this.getColorDistance(colorsA[i], colorsA[i + 1], colorsA[i + 2], colorsB[i], colorsB[i + 1], colorsB[i + 2]));
        }
        return this.getMedian(colorDiffs);
    }

    this.getColorDistance = function(ra, ga, ba, rb, gb, bb) {
        return Math.sqrt((ra - rb) * (ra - rb) + (ga - gb) * (ga - gb) + (ba - bb) * (ba - bb));
    }

    this.getMedian = function(array) {
        if (!array.length) {return 0};
        var numbers = array.slice(0).sort((a,b) => a - b);
        var middle = Math.floor(numbers.length / 2);
        var isEven = numbers.length % 2 === 0;
        return isEven ? (numbers[middle] + numbers[middle - 1]) / 2 : numbers[middle];
    }

}