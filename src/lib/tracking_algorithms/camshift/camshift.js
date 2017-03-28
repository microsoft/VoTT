/**
 * camshift object tracker
 *
 * ported with some optimizations from actionscript3 library FaceIt:
 *     http://www.mukimuki.fr/flashblog/2009/06/18/camshift-going-to-the-source/
 *	 http://www.libspark.org/browser/as3/FaceIt
 * some explanation of algorithm here : 
 *	 http://www.cognotics.com/opencv/servo_2007_series/part_3/sidebar.html
 *
 * usage:
 *	 // create a new tracker
 *	 var cstracker = new regiontrackr.camshift.Tracker();
 *	 // initialize it with a canvas, and a rectangle around the object on the canvas we'd like to track
 *	 cstracker.initTracker(some_canvas, new regiontrackr.camshift.Rectangle(x,y,w,h));
 *	 // find object in same or some other canvas
 *	 cstracker.track(some_canvas);
 *	 // get position of found object
 *	 var currentPos = cstracker.getTrackObj();
 *	 currentPos.x // x-coordinate of center of object on canvas 
 *	 currentPos.y // y-coordinate of center of object on canvas 
 *	 currentPos.width // width of object
 *	 currentPos.height // heigh of object
 *	 currentPos.angle // angle of object in radians
 *
 * @author Benjamin Jung / jungbenj@gmail.com
 * @author auduno / github.com/auduno
 *
 * License of original actionscript code:
 *
 * Copyright (C)2009 Benjamin Jung
 * 
 * Licensed under the MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

var regiontrackr = {};
regiontrackr.camshift = {};

/**
 * RGB histogram
 *
 * @constructor
 */
regiontrackr.camshift.Histogram = function(imgdata) {

  this.size = 4096;
  
  var bins = [];
  var i, x, r, g, b, il;
  
  //initialize bins
  for (i = 0; i < this.size; i++) {
    bins.push(0);
  }
  
  //add histogram data
  for (x = 0, il = imgdata.length;x < il; x += 4) {
    r = imgdata[x+0] >> 4; // round down to bins of 16
    g = imgdata[x+1] >> 4;
    b = imgdata[x+2] >> 4;
    bins[256 * r + 16 * g + b] += 1;
  }
  
  this.getBin = function( index ) {
    return bins[index];
  }
};

/**
 * moments object
 *
 * @constructor
 */
regiontrackr.camshift.Moments = function(data, x, y, w, h, second) {
  
  this.m00 = 0;
  this.m01 = 0;
  this.m10 = 0;
  this.m11 = 0;
  this.m02 = 0;
  this.m20 = 0;
  
  var i, j, val, vx, vy;
  var a = [];
  for (i = x; i < w; i++) {
    a = data[i];
    vx = i-x;
    
    for (j = y; j < h; j++) {
      val = a[j];
      
      vy = j-y;
      this.m00 += val;
      this.m01 += vy * val;
      this.m10 += vx * val;
      if (second) {
        this.m11 += vx * vy * val;
        this.m02 += vy * vy * val;
        this.m20 += vx * vx * val;
      }
    }
  }
  
  this.invM00 = 1 / this.m00;
  this.xc = this.m10 * this.invM00;
  this.yc = this.m01 * this.invM00;
  this.mu00 = this.m00;
  this.mu01 = 0;
  this.mu10 = 0;
  if (second) {
    this.mu20 = this.m20 - this.m10 * this.xc;
    this.mu02 = this.m02 - this.m01 * this.yc;
    this.mu11 = this.m11 - this.m01 * this.xc;
  }
};

/**
 * rectangle object
 *
 * @constructor
 */
regiontrackr.camshift.Rectangle = function(x,y,w,h) {
  this.x = x;
  this.y = y;
  this.width = w;
  this.height = h;
  
  this.clone = function() {
    var c = new regiontrackr.camshift.Rectangle();
    c.height = this.height;
    c.width = this.width;
    c.x = this.x;
    c.y = this.y;
    return c;
  }
};

/**
 * Tracker object
 *
 * @constructor
 */
regiontrackr.camshift.Tracker = function(params) {
  
  if (params === undefined) params = {};
  if (params.calcAngles === undefined) params.calcAngles = true;
  
  var _modelHist,
    _curHist, //current histogram
    _pdf, // pixel probability data for current searchwindow
    _searchWindow, // rectangle where we are searching
    _trackObj, // object holding data about where current tracked object is
    _canvasCtx, // canvas context for initial canvas
    _canvasw, // canvas width for tracking canvas
    _canvash; // canvas height for tracking canvas
  
  this.getSearchWindow = function() {
    // return the search window used by the camshift algorithm in the current analysed image
    return _searchWindow.clone();
  }
  
  this.getTrackObj = function() {
    // return a trackobj with the size and orientation of the tracked object in the current analysed image
    return _trackObj.clone();
  }
  
  this.getPdf = function() {
    // returns a nested array representing color
    return _pdf;
  }
  
  this.getBackProjectionImg = function() {
    // return imgData representing pixel color probabilities, which can then be put into canvas
    var weights = _pdf;
    var w = _canvasw;
    var h = _canvash;
    var img = _canvasCtx.createImageData(w, h);
    var imgData = img.data;
    var x, y, val;
    for (x = 0; x < w; x++) {
      for (y = 0; y < h; y++) {
        val = Math.floor(255 * weights[x][y]);
        pos = ((y*w)+x)*4;
        imgData[pos] = val;
        imgData[pos+1] = val;
        imgData[pos+2] = val;
        imgData[pos+3] = 255;
      }
    }
    return img;
  }
  
  this.initTracker = function(canvas, trackedArea) {
    // initialize the tracker with canvas and the area of interest as a rectangle
    
    _canvasCtx = canvas.getContext("2d");
    var taw = trackedArea.width;
    var tah = trackedArea.height;
    var tax = trackedArea.x;
    var tay = trackedArea.y;
    var trackedImg = _canvasCtx.getImageData(tax, tay, taw, tah);
    
    _modelHist = new regiontrackr.camshift.Histogram(trackedImg.data);
    _searchWindow = trackedArea.clone();
    _trackObj = new regiontrackr.camshift.TrackObj();
  }
  
  this.track = function(canvas) {
    // search the tracked object by camshift
    var canvasCtx = canvas.getContext("2d");
    _canvash = canvas.height;
    _canvasw = canvas.width;
    var imgData = canvasCtx.getImageData(0, 0, canvas.width, canvas.height);
    if (imgData.width != 0 && imgData.height != 0) camShift(imgData);
  }
  
  function camShift(frame) {

    var w = frame.width;
    var h = frame.height;
    
    // search location
    var m = meanShift(frame);
    
    var a = m.mu20 * m.invM00;
    var c = m.mu02 * m.invM00;
    
    if (params.calcAngles) {
      // use moments to find size and orientation
      var b = m.mu11 * m.invM00;
      var d = a + c;
      var e = Math.sqrt((4*b * b) + ((a - c) * (a - c)));
      
      // update object position
      _trackObj.width = Math.sqrt((d - e)*0.5) << 2;
      _trackObj.height = Math.sqrt((d + e)*0.5) << 2;
      _trackObj.angle = Math.atan2(2 * b, a - c + e);
      
      // to have a positive counter clockwise angle
      if (_trackObj.angle < 0) _trackObj.angle = _trackObj.angle + Math.PI;
    } else {
      _trackObj.width = Math.sqrt(a) << 2;
      _trackObj.height = Math.sqrt(c) << 2;
      _trackObj.angle = Math.PI/2;
    }
    
    // check if tracked object is into the limit
    _trackObj.x = Math.floor(Math.max(0, Math.min(_searchWindow.x + _searchWindow.width/2, w)));
    _trackObj.y = Math.floor(Math.max(0, Math.min(_searchWindow.y + _searchWindow.height/2, h)));
    
    // new search window size
    _searchWindow.width = Math.floor(1.1 * _trackObj.width);
    _searchWindow.height = Math.floor(1.1 * _trackObj.height);
  }
  
  function meanShift(frame) {
    // mean-shift algorithm on frame
    
    var w = frame.width;
    var h = frame.height;
    var imgData = frame.data;
    
    var curHist = new regiontrackr.camshift.Histogram(imgData);
    
    var weights = getWeights(_modelHist, curHist);
    
    // Color probabilities distributions
    _pdf = getBackProjectionData(imgData, frame.width, frame.height, weights);
    
    var m, x, y, i, wadx, wady, wadw, wadh;
    
    var meanShiftIterations = 10; // maximum number of iterations
    
    // store initial searchwindow
    var prevx = _searchWindow.x;
    var prevy = _searchWindow.y;
    
    // Locate by iteration the maximum of density into the probability distributions
    for (i = 0;i < meanShiftIterations; i++) {
      // get searchwindow from _pdf:
      wadx = Math.max(_searchWindow.x,0);
      wady = Math.max(_searchWindow.y,0);
      wadw = Math.min(wadx + _searchWindow.width,w);
      wadh = Math.min(wady + _searchWindow.height,h);
      
      m = new regiontrackr.camshift.Moments(_pdf, wadx, wady, wadw, wadh, (i == meanShiftIterations -1));
      x = m.xc;
      y = m.yc;
      
      _searchWindow.x += ((x - _searchWindow.width/2) >> 0);
      _searchWindow.y += ((y - _searchWindow.height/2) >> 0);
      
      // if we have reached maximum density, get second moments and stop iterations
      if (_searchWindow.x == prevx && _searchWindow.y == prevy) {
        m = new regiontrackr.camshift.Moments(_pdf, wadx, wady, wadw, wadh, true);
        break;
      } else {
        prevx = _searchWindow.x;
        prevy = _searchWindow.y;
      }
    }
    
    _searchWindow.x = Math.max(0, Math.min(_searchWindow.x, w));
    _searchWindow.y = Math.max(0, Math.min(_searchWindow.y, h));
    
    return m;
  }
  
  function getWeights(mh, ch) {
    // Return an array of the probabilities of each histogram color bins
    var weights = [];
    var p;
    
    // iterate over the entire histogram and compare
    for (var i = 0; i < 4096; i++) {
      if (ch.getBin(i) != 0) {
        p = Math.min(mh.getBin(i)/ch.getBin(i), 1);
      } else {
        p = 0;
      }
      weights.push(p);
    }
    
    return weights;
  }
  
  function getBackProjectionData(imgData, idw, idh, weights, hsMap) {
    // Return a matrix representing pixel color probabilities
    var data = [];
    var x,y,r,g,b,pos;
    var a = [];
    
    // TODO : we could use typed arrays here
    // but we should then do a compatibilitycheck
    
    for (x = 0; x < idw; x++) {
      a = [];
      for (y = 0; y < idh; y++) {
        pos = ((y*idw)+x)*4;
        r = imgData[pos] >> 4;
        g = imgData[pos+1] >> 4;
        b = imgData[pos+2] >> 4;
        a.push(weights[256 * r + 16 * g + b]);
      }
      data[x] = a;
    }
    return data;
  }
};

/**
 * Object returned by tracker
 *  note that x,y is the point of the center of the tracker
 *
 * @constructor
 */
regiontrackr.camshift.TrackObj = function() {
  this.height = 0;
  this.width = 0;
  this.angle = 0;
  this.x = 0; 
  this.y = 0;
  
  this.clone = function() {
    var c = new regiontrackr.camshift.TrackObj();
    c.height = this.height;
    c.width = this.width;
    c.angle = this.angle;
    c.x = this.x;
    c.y = this.y;
    return c;
  }
};