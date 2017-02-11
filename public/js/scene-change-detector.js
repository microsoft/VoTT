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

    this.detectSceneChange = function(lastImgData, currentImgData) {
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