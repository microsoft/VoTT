(function(glob){
    var AreaSelector = {
        baseParent: null,
        paper: null,
        paperWidth: 0,
        paperHeight: 0,

        overlay: null,
        mask: null,        
        selectionBox: null,
        overlayMask: null,

        crossA: null,
        crossB: null,
        capturingState: false,

        onSelectionCallback: null,

        init: function(svgZone, onSelection) {
            this.baseParent = svgZone;
            this.paper = Snap(svgZone);
            this.paperWidth = svgZone.width.baseVal.value;
            this.paperHeight = svgZone.height.baseVal.value;

            this.overlay = this.createOverlay();

            this.mask = this.createMask();
            this.selectionBox = this.createSelectionBox();
            this.overlayMask = this.paper.g();
            this.overlayMask.mask = this.mask;
            this.overlayMask.add(this.mask, this.selectionBox);
            this.overlay.attr({
                mask: this.overlayMask
            });

            this.crossA = this.createCross();
            this.crossB = this.createCross();
            this.subscribeToMouseEvents();

            this.onSelectionCallback = onSelection;

            return this;
        },

        resize: function(width, height) {
            if (width !== undefined && height !== undefined) {
                this.paperWidth = width;
                this.paperHeight = height;
                this.baseParent.style.width = width;
                this.baseParent.style.height = height;
            } else {
                this.paperWidth = this.baseParent.width.baseVal.value;
                this.paperHeight = this.baseParent.height.baseVal.value;
            }

            this.overlay.attr({
                width: this.paperWidth,
                height: this.paperHeight
            });

            this.mask.attr({
                width: this.paperWidth,
                height: this.paperHeight
            });
        },

        createOverlay: function() {
            var rect = this.paper.rect(0, 0, this.paperWidth, this.paperHeight);
            rect.attr({
                fill: '#000',
                "fill-opacity": 0.5,
                strokeWidth: 0,
                visibility: 'hidden'   
            });

            return rect;
        },

        createMask: function() {
            var rect = this.paper.rect(0, 0, this.paperWidth, this.paperHeight);
            rect.attr({
                fill: '#fff',
                strokeWidth: 0,
                visibility: 'visible'   
            });

            return rect;
        },

        createSelectionBox: function() {
            var rect = this.paper.rect(0, 0, 0, 0);
            rect.attr({
                fill: '#000',
                strokeWidth: 0,
                visibility: 'visible' 
            });
            return rect;
        },

        createCross: function() {
            var verticalLine = this.paper.line(0, 0, 0, this.paperHeight);
            // TODO: Move default line styles to CSS
            verticalLine.attr({
                strokeWidth:1,
                strokeDasharray: '5 5',
                stroke: "#666"
            })
            var horizontalLine = this.paper.line(0, 0, this.paperWidth, 0);
            horizontalLine.attr({
                strokeWidth:1,
                strokeDasharray: '5 5',
                stroke: "#666"
            })

            var cross = this.paper.g();
            cross.add(verticalLine, horizontalLine);
            cross.vl = verticalLine;
            cross.hl = horizontalLine;

            cross.x = 0;
            cross.y = 0;

            cross.attr({
                visibility: 'hidden'
            });

            return cross;
        },

        subscribeToMouseEvents: function() {
            var self = this;
            this.baseParent.addEventListener("pointerenter", function(e){
            });
            this.baseParent.addEventListener("pointerleave", function(e){
                self.hide(self.crossA);
                self.hide(self.crossB);

                self.hide(self.selectionBox);
            });
            this.baseParent.addEventListener("pointerdown", function(e){
                self.baseParent.setPointerCapture(e.pointerId);

                self.capturingState = true;

                var rect = self.baseParent.getClientRects();
                var x = e.clientX - rect[0].left;
                var y = e.clientY - rect[0].top;

                self.moveCross(self.crossB, x, y); 
                self.show(self.crossB);     
                self.moveSelectionBox(self.selectionBox, self.crossA, self.crossB); 
                self.show(self.selectionBox);           
                self.show(self.overlay);                        
            });
            this.baseParent.addEventListener("pointerup", function(e){
                self.baseParent.releasePointerCapture(e.pointerId);
                self.capturingState = false;

                self.hide(self.crossB);
                self.hide(self.overlay);                    
                
                if (typeof self.onSelectionCallback === "function") {
                    self.onSelectionCallback(self.crossA.x, self.crossA.y, self.crossB.x, self.crossB.y);
                }

            });
            this.baseParent.addEventListener("pointermove", function(e){
                var rect = self.baseParent.getClientRects();
                var x = e.clientX - rect[0].left;
                var y = e.clientY - rect[0].top;

                if (self.capturingState) {                    
                    self.moveCross(self.crossB, x, y);                    
                    self.moveSelectionBox(self.selectionBox, self.crossA, self.crossB);
                } else {                    
                    self.moveCross(self.crossA, x, y);
                    self.show(self.crossA);
                }
            });
        },

        moveCross: function(cross, x, y) {
            var self = this;
            window.requestAnimationFrame(function(){
                // Move vertical line
                var xx = (x < 0) ? 0 : ((x > self.paperWidth) ? self.paperWidth : x);
                var yy = (y < 0) ? 0 : ((y > self.paperHeight) ? self.paperHeight : y);
                cross.vl.attr({
                        x1: xx,
                        x2: xx,
                        y2: self.paperHeight
                });

                // Move horizontal line
                cross.hl.attr({
                        y1: yy,
                        x2: self.paperWidth,
                        y2: yy
                })

                cross.x = xx;
                cross.y = yy;
            })            
        },

        show: function(element) {
            window.requestAnimationFrame(function(){
                element.attr({
                    visibility: 'visible'
                });
            }) 
        },

        hide: function(element) {
            window.requestAnimationFrame(function(){
                element.attr({
                    visibility: 'hidden'
                });
            }) 
        },

        moveSelectionBox: function(box, crossA, crossB) {
            var x = (crossA.x < crossB.x) ? crossA.x : crossB.x;
            var y = (crossA.y < crossB.y) ? crossA.y : crossB.y;
            var w = Math.abs(crossA.x - crossB.x);
            var h = Math.abs(crossA.y - crossB.y);

            window.requestAnimationFrame(function(){
                box.attr({
                    x: x,
                    y: y,
                    width: w,
                    height: h
                });
            })             
        }
    };

    glob.AreaSelector = AreaSelector;
})(window);