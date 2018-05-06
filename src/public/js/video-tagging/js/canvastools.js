define("basetool", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var CanvasTools;
    (function (CanvasTools) {
        var Base;
        (function (Base) {
            class Rect {
                constructor(width, height) {
                    this.resize(width, height);
                }
                resize(width, height) {
                    this.width = width;
                    this.height = height;
                }
            }
            Base.Rect = Rect;
            class Point2D {
                constructor(x, y) {
                    this.x = x;
                    this.y = y;
                }
                boundToRect(r) {
                    let newp = new Point2D(0, 0);
                    newp.x = (this.x < 0) ? 0 : ((this.x > r.width) ? r.width : this.x);
                    newp.y = (this.y < 0) ? 0 : ((this.y > r.height) ? r.height : this.y);
                    return newp;
                }
            }
            Base.Point2D = Point2D;
        })(Base = CanvasTools.Base || (CanvasTools.Base = {}));
    })(CanvasTools = exports.CanvasTools || (exports.CanvasTools = {}));
});
define("regiontool", ["require", "exports", "basetool", "./public/js/video-tagging/js/snap.svg.js"], function (require, exports, CT, Snap) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var base = CT.CanvasTools.Base;
    var CanvasTools;
    (function (CanvasTools) {
        var Region;
        (function (Region) {
            class AncorsElement {
                get width() {
                    return this.rect.width;
                }
                set width(width) {
                    this.resize(width, this.rect.height);
                }
                get height() {
                    return this.rect.height;
                }
                ;
                set height(height) {
                    this.resize(this.rect.width, height);
                }
                constructor(paper, x, y, rect, boundRect = null, onChange, onManipulationBegin, onManipulationEnd) {
                    this.x = x;
                    this.y = y;
                    this.rect = rect;
                    this.onChange = onChange;
                    this.boundRect = boundRect;
                    if (onManipulationBegin !== undefined) {
                        this.onManipulationBegin = onManipulationBegin;
                    }
                    if (onManipulationEnd !== undefined) {
                        this.onManipulationEnd = onManipulationEnd;
                    }
                    this.buildOn(paper);
                    this.subscribeToEvents();
                }
                buildOn(paper) {
                    this.ancorsGroup = paper.g();
                    this.ancorsGroup.addClass("ancorsLayer");
                    this.ancors = {
                        TL: this.createAncor(paper),
                        TR: this.createAncor(paper),
                        BL: this.createAncor(paper),
                        BR: this.createAncor(paper)
                    };
                    this.ghostAncor = this.createAncor(paper, 7);
                    this.ghostAncor.addClass("ghost");
                    this.rearrangeAncors();
                    this.ancorsGroup.add(this.ancors.TL);
                    this.ancorsGroup.add(this.ancors.TR);
                    this.ancorsGroup.add(this.ancors.BR);
                    this.ancorsGroup.add(this.ancors.BL);
                    this.ancorsGroup.add(this.ghostAncor);
                }
                createAncor(paper, r = 3) {
                    let a = paper.circle(0, 0, r);
                    a.addClass("ancorStyle");
                    return a;
                }
                move(x, y) {
                    this.x = x;
                    this.y = y;
                    this.rearrangeAncors();
                }
                resize(width, height) {
                    this.rect.width = width;
                    this.rect.height = height;
                    this.rearrangeAncors();
                }
                rearrangeAncors() {
                    let self = this;
                    window.requestAnimationFrame(function () {
                        self.ancors.TL.attr({ cx: self.x, cy: self.y });
                        self.ancors.TR.attr({ cx: self.x + self.width, cy: self.y });
                        self.ancors.BR.attr({ cx: self.x + self.width, cy: self.y + self.height });
                        self.ancors.BL.attr({ cx: self.x, cy: self.y + self.height });
                    });
                }
                rearrangeCoord(p1, p2) {
                    let x = (p1.x < p2.x) ? p1.x : p2.x;
                    let y = (p1.y < p2.y) ? p1.y : p2.y;
                    let width = Math.abs(p1.x - p2.x);
                    let height = Math.abs(p1.y - p2.y);
                    this.flipActiveAncor(p1.x - p2.x > 0, p1.y - p2.y > 0);
                    this.onChange(x, y, width, height);
                }
                flipActiveAncor(w, h) {
                    let ac = "";
                    if (this.activeAncor !== "") {
                        ac += (this.activeAncor[0] == "T") ? (h ? "B" : "T") : (h ? "T" : "B");
                        ac += (this.activeAncor[1] == "L") ? (w ? "R" : "L") : (w ? "L" : "R");
                    }
                    this.activeAncor = ac;
                }
                ancorDragBegin() {
                }
                getDragOriginPoint() {
                    let x, y;
                    switch (this.activeAncor) {
                        case "TL": {
                            x = this.x;
                            y = this.y;
                            break;
                        }
                        case "TR": {
                            x = this.x + this.width;
                            y = this.y;
                            break;
                        }
                        case "BL": {
                            x = this.x;
                            y = this.y + this.height;
                            break;
                        }
                        case "BR": {
                            x = this.x + this.width;
                            y = this.y + this.height;
                            break;
                        }
                    }
                    return new base.Point2D(x, y);
                }
                ancorDragMove(dx, dy, x, y) {
                    let p1, p2;
                    let x1, y1, x2, y2;
                    switch (this.activeAncor) {
                        case "TL": {
                            x1 = this.dragOrigin.x + dx;
                            y1 = this.dragOrigin.y + dy;
                            x2 = this.x + this.width;
                            y2 = this.y + this.height;
                            break;
                        }
                        case "TR": {
                            x1 = this.x;
                            y1 = this.dragOrigin.y + dy;
                            x2 = this.dragOrigin.x + dx;
                            y2 = this.y + this.height;
                            break;
                        }
                        case "BL": {
                            x1 = this.dragOrigin.x + dx;
                            y1 = this.y;
                            x2 = this.x + this.width;
                            y2 = this.dragOrigin.y + dy;
                            break;
                        }
                        case "BR": {
                            x1 = this.x;
                            y1 = this.y;
                            x2 = this.dragOrigin.x + dx;
                            y2 = this.dragOrigin.y + dy;
                            break;
                        }
                    }
                    p1 = new base.Point2D(x1, y1);
                    p2 = new base.Point2D(x2, y2);
                    if (this.boundRect !== null) {
                        p1 = p1.boundToRect(this.boundRect);
                        p2 = p2.boundToRect(this.boundRect);
                    }
                    let self = this;
                    window.requestAnimationFrame(function () {
                        self.ghostAncor.attr({ cx: self.dragOrigin.x + dx, cy: self.dragOrigin.y + dy });
                    });
                    this.rearrangeCoord(p1, p2);
                }
                ;
                ancorDragEnd() {
                    this.ghostAncor.attr({
                        display: "none"
                    });
                }
                subscribeToEvents() {
                    let self = this;
                    this.subscribeAncorToEvents(this.ancors.TL, "TL");
                    this.subscribeAncorToEvents(this.ancors.TR, "TR");
                    this.subscribeAncorToEvents(this.ancors.BL, "BL");
                    this.subscribeAncorToEvents(this.ancors.BR, "BR");
                    self.ghostAncor.mouseover(function (e) {
                        self.ghostAncor.drag(self.ancorDragMove.bind(self), self.ancorDragBegin.bind(self), self.ancorDragEnd.bind(self));
                        self.onManipulationBegin();
                    });
                    self.ghostAncor.mouseout(function (e) {
                        self.ghostAncor.undrag();
                        window.requestAnimationFrame(function () {
                            self.ghostAncor.attr({
                                display: "none"
                            });
                        });
                        self.onManipulationEnd();
                    });
                    self.ghostAncor.node.addEventListener("pointerdown", function (e) {
                        self.ghostAncor.node.setPointerCapture(e.pointerId);
                    });
                    self.ghostAncor.node.addEventListener("pointerup", function (e) {
                        self.ghostAncor.node.releasePointerCapture(e.pointerId);
                    });
                }
                subscribeAncorToEvents(ancor, active) {
                    let self = this;
                    ancor.mouseover(function (e) {
                        self.activeAncor = active;
                        let p = self.getDragOriginPoint();
                        self.dragOrigin = p;
                        window.requestAnimationFrame(function () {
                            self.ghostAncor.attr({
                                cx: p.x,
                                cy: p.y,
                                display: 'block'
                            });
                        });
                    });
                }
                hide() {
                    let self = this;
                    window.requestAnimationFrame(function () {
                        self.ancorsGroup.attr({
                            visibility: 'hidden'
                        });
                    });
                }
                show() {
                    let self = this;
                    window.requestAnimationFrame(function () {
                        self.ancorsGroup.attr({
                            visibility: 'visible'
                        });
                    });
                }
            }
            class TagsElement {
                get width() {
                    return this.rect.width;
                }
                set width(width) {
                    this.resize(width, this.rect.height);
                }
                get height() {
                    return this.rect.height;
                }
                ;
                set height(height) {
                    this.resize(this.rect.width, height);
                }
                constructor() {
                }
                resize(width, height) {
                    this.rect.width = width;
                    this.rect.height = height;
                }
                hide() {
                    let self = this;
                    window.requestAnimationFrame(function () {
                        self.tagsGroup.attr({
                            visibility: 'hidden'
                        });
                    });
                }
                show() {
                    let self = this;
                    window.requestAnimationFrame(function () {
                        self.tagsGroup.attr({
                            visibility: 'visible'
                        });
                    });
                }
            }
            class RegionElement {
                constructor(paper, rect, boundRect = null, onManipulationBegin, onManipulationEnd) {
                    this.isSelected = false;
                    this.x = 0;
                    this.y = 0;
                    this.rect = rect;
                    if (boundRect !== null) {
                        this.boundRects = {
                            host: boundRect,
                            self: new base.Rect(boundRect.width - rect.width, boundRect.height - rect.height)
                        };
                    }
                    if (onManipulationBegin !== undefined) {
                        this.onManipulationBegin = onManipulationBegin;
                    }
                    if (onManipulationEnd !== undefined) {
                        this.onManipulationEnd = onManipulationEnd;
                    }
                    this.buildOn(paper);
                    this.subscribeToEvents();
                }
                get width() {
                    return this.rect.width;
                }
                set width(width) {
                    this.resize(width, this.rect.height);
                }
                get height() {
                    return this.rect.height;
                }
                ;
                set height(height) {
                    this.resize(this.rect.width, height);
                }
                buildOn(paper) {
                    this.regionGroup = paper.g();
                    this.regionGroup.addClass("regionStyle");
                    this.regionRect = paper.rect(0, 0, this.width, this.height);
                    this.regionRect.addClass("regionRectStyle");
                    this.ancors = new AncorsElement(paper, this.x, this.y, this.rect, this.boundRects.host, this.onInternalChange.bind(this), this.onManipulationBegin, this.onManipulationEnd);
                    this.regionGroup.add(this.regionRect);
                    this.regionGroup.add(this.ancors.ancorsGroup);
                }
                onInternalChange(x, y, width, height) {
                    this.move(new base.Point2D(x, y));
                    this.resize(width, height);
                }
                move(p) {
                    let self = this;
                    this.x = p.x;
                    this.y = p.y;
                    window.requestAnimationFrame(function () {
                        self.regionRect.attr({
                            x: p.x,
                            y: p.y
                        });
                        self.ancors.move(p.x, p.y);
                    });
                }
                resize(width, height) {
                    this.rect.width = width;
                    this.rect.height = height;
                    this.boundRects.self.width = this.boundRects.host.width - width;
                    this.boundRects.self.height = this.boundRects.host.height - height;
                    let self = this;
                    window.requestAnimationFrame(function () {
                        self.regionRect.attr({
                            width: width,
                            height: height
                        });
                        self.ancors.resize(width, height);
                    });
                }
                hide() {
                    let self = this;
                    window.requestAnimationFrame(function () {
                        self.regionGroup.attr({
                            visibility: 'hidden'
                        });
                    });
                }
                show() {
                    let self = this;
                    window.requestAnimationFrame(function () {
                        self.regionGroup.attr({
                            visibility: 'visible'
                        });
                    });
                }
                select() {
                    this.isSelected = true;
                    this.regionGroup.addClass("selected");
                }
                unselect() {
                    this.isSelected = false;
                    this.regionGroup.removeClass("selected");
                }
                rectDragBegin() {
                    this.dragOrigin = new base.Point2D(this.x, this.y);
                }
                rectDragMove(dx, dy) {
                    let p;
                    p = new base.Point2D(this.dragOrigin.x + dx, this.dragOrigin.y + dy);
                    if (this.boundRects !== null) {
                        p = p.boundToRect(this.boundRects.self);
                    }
                    this.move(p);
                }
                ;
                rectDragEnd() {
                    this.dragOrigin = null;
                }
                subscribeToEvents() {
                    let self = this;
                    self.regionRect.click(function (e) {
                        if (self.isSelected) {
                            self.unselect();
                        }
                        else {
                            self.select();
                        }
                    }, this);
                    self.regionRect.mouseover(function (e) {
                        self.regionRect.drag(self.rectDragMove.bind(self), self.rectDragBegin.bind(self), self.rectDragEnd.bind(self));
                        self.onManipulationBegin();
                    });
                    self.regionRect.mouseout(function (e) {
                        self.regionRect.undrag();
                        self.onManipulationEnd();
                    });
                    self.regionRect.node.addEventListener("pointerdown", function (e) {
                        self.regionRect.node.setPointerCapture(e.pointerId);
                    });
                    self.regionRect.node.addEventListener("pointerup", function (e) {
                        self.regionRect.node.releasePointerCapture(e.pointerId);
                    });
                }
            }
            class RegionsManager {
                constructor(svgHost, onManipulationBegin, onManipulationEnd) {
                    this.baseParent = svgHost;
                    this.paper = Snap(svgHost);
                    this.paperRect = new base.Rect(svgHost.width.baseVal.value, svgHost.height.baseVal.value);
                    this.regionManagerLayer = this.paper.g();
                    this.regionManagerLayer.addClass("regionManager");
                    this.onManipulationBegin = onManipulationBegin;
                    this.onManipulationEnd = onManipulationEnd;
                }
                addRegion(pointA, pointB) {
                    let x = (pointA.x < pointB.x) ? pointA.x : pointB.x;
                    let y = (pointA.y < pointB.y) ? pointA.y : pointB.y;
                    let w = Math.abs(pointA.x - pointB.x);
                    let h = Math.abs(pointA.y - pointB.y);
                    let region = new RegionElement(this.paper, new base.Rect(w, h), this.paperRect, this.onManipulationBegin, this.onManipulationEnd);
                    region.move(new base.Point2D(x, y));
                    this.regionManagerLayer.add(region.regionGroup);
                }
            }
            Region.RegionsManager = RegionsManager;
        })(Region = CanvasTools.Region || (CanvasTools.Region = {}));
    })(CanvasTools = exports.CanvasTools || (exports.CanvasTools = {}));
});
define("selectiontool", ["require", "exports", "basetool", "./public/js/video-tagging/js/snap.svg.js"], function (require, exports, CT, Snap) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var base = CT.CanvasTools.Base;
    var CanvasTools;
    (function (CanvasTools) {
        var Selection;
        (function (Selection) {
            class CrossElement {
                constructor(paper, rect) {
                    this.build(paper, rect.width, rect.height, 0, 0);
                }
                build(paper, width, height, x, y) {
                    let verticalLine = paper.line(0, 0, 0, height);
                    let horizontalLine = paper.line(0, 0, width, 0);
                    this.crossGroup = paper.g();
                    this.crossGroup.addClass("crossStyle");
                    this.crossGroup.add(verticalLine);
                    this.crossGroup.add(horizontalLine);
                    this.hl = horizontalLine;
                    this.vl = verticalLine;
                    this.x = x;
                    this.y = y;
                }
                boundToRect(rect) {
                    return new base.Point2D(this.x, this.y).boundToRect(rect);
                }
                move(p, rect, square = false, ref = null) {
                    let np = p.boundToRect(rect);
                    if (square) {
                        let dx = Math.abs(np.x - ref.x);
                        let vx = Math.sign(np.x - ref.x);
                        let dy = Math.abs(np.y - ref.y);
                        let vy = Math.sign(np.y - ref.y);
                        let d = Math.min(dx, dy);
                        np.x = ref.x + d * vx;
                        np.y = ref.y + d * vy;
                    }
                    this.x = np.x;
                    this.y = np.y;
                    let self = this;
                    window.requestAnimationFrame(function () {
                        self.vl.attr({
                            x1: np.x,
                            x2: np.x,
                            y2: rect.height
                        });
                        self.hl.attr({
                            y1: np.y,
                            x2: rect.width,
                            y2: np.y
                        });
                    });
                }
                resize(width, height) {
                    let self = this;
                    window.requestAnimationFrame(function () {
                        self.vl.attr({
                            y2: height
                        });
                        self.hl.attr({
                            x2: width,
                        });
                    });
                }
                hide() {
                    let self = this;
                    window.requestAnimationFrame(function () {
                        self.crossGroup.attr({
                            visibility: 'hidden'
                        });
                    });
                }
                show() {
                    let self = this;
                    window.requestAnimationFrame(function () {
                        self.crossGroup.attr({
                            visibility: 'visible'
                        });
                    });
                }
            }
            class RectElement {
                constructor(paper, rect) {
                    this.build(paper, rect.width, rect.height);
                }
                build(paper, width, height) {
                    this.rect = paper.rect(0, 0, width, height);
                    this.width = width;
                    this.height = height;
                }
                move(p) {
                    let self = this;
                    window.requestAnimationFrame(function () {
                        self.rect.attr({
                            x: p.x,
                            y: p.y
                        });
                    });
                }
                resize(width, height) {
                    this.width = width;
                    this.height = height;
                    let self = this;
                    window.requestAnimationFrame(function () {
                        self.rect.attr({
                            width: width,
                            height: height
                        });
                    });
                }
                hide() {
                    let self = this;
                    window.requestAnimationFrame(function () {
                        self.rect.attr({
                            visibility: 'hidden'
                        });
                    });
                }
                show() {
                    let self = this;
                    window.requestAnimationFrame(function () {
                        self.rect.attr({
                            visibility: 'visible'
                        });
                    });
                }
            }
            class AreaSelector {
                constructor(svgHost, onSelectionBegin, onSelectionEnd) {
                    this.capturingState = false;
                    this.isEnabled = true;
                    this.squareMode = false;
                    this.twoPointsMode = false;
                    this.buildUIElements(svgHost);
                    this.subscribeToEvents();
                    this.onSelectionEndCallback = onSelectionEnd;
                    this.onSelectionBeginCallback = onSelectionBegin;
                }
                buildUIElements(svgHost) {
                    this.baseParent = svgHost;
                    this.paper = Snap(svgHost);
                    this.paperRect = new base.Rect(svgHost.width.baseVal.value, svgHost.height.baseVal.value);
                    this.areaSelectorLayer = this.paper.g();
                    this.areaSelectorLayer.addClass("areaSelector");
                    this.overlay = this.createOverlay();
                    this.mask = this.createMask();
                    this.selectionBox = this.createSelectionBoxMask();
                    let combinedMask = this.paper.g();
                    combinedMask.add(this.mask.rect);
                    combinedMask.add(this.selectionBox.rect);
                    this.overlay.rect.attr({
                        mask: combinedMask
                    });
                    this.crossA = this.createCross();
                    this.crossB = this.createCross();
                    this.areaSelectorLayer.add(this.overlay.rect);
                    this.areaSelectorLayer.add(this.crossA.crossGroup);
                    this.areaSelectorLayer.add(this.crossB.crossGroup);
                }
                createOverlay() {
                    let r = new RectElement(this.paper, this.paperRect);
                    r.rect.addClass("overlayStyle");
                    r.hide();
                    return r;
                }
                createMask() {
                    let r = new RectElement(this.paper, this.paperRect);
                    r.rect.addClass("overlayMaskStyle");
                    return r;
                }
                createSelectionBoxMask() {
                    let r = new RectElement(this.paper, new base.Rect(0, 0));
                    r.rect.addClass("selectionBoxMaskStyle");
                    return r;
                }
                createCross() {
                    let cr = new CrossElement(this.paper, this.paperRect);
                    cr.hide();
                    return cr;
                }
                resize(width, height) {
                    if (width !== undefined && height !== undefined) {
                        this.paperRect.resize(width, height);
                        this.baseParent.style.width = width.toString();
                        this.baseParent.style.height = height.toString();
                    }
                    else {
                        this.paperRect.resize(this.baseParent.width.baseVal.value, this.baseParent.height.baseVal.value);
                    }
                    this.resizeAll([this.overlay, this.mask, this.crossA, this.crossB]);
                }
                resizeAll(elementSet) {
                    elementSet.forEach(element => {
                        element.resize(this.paperRect.width, this.paperRect.height);
                    });
                }
                showAll(elementSet) {
                    elementSet.forEach(element => {
                        element.show();
                    });
                }
                hideAll(elementSet) {
                    elementSet.forEach(element => {
                        element.hide();
                    });
                }
                onPointerEnter(e) {
                    this.crossA.show();
                }
                onPointerLeave(e) {
                    let rect = this.baseParent.getClientRects();
                    let p = new base.Point2D(e.clientX - rect[0].left, e.clientY - rect[0].top);
                    if (!this.twoPointsMode && !this.capturingState) {
                        this.hideAll([this.crossA, this.crossB, this.selectionBox]);
                    }
                    else if (this.twoPointsMode && this.capturingState) {
                        this.moveCross(this.crossB, p);
                        this.moveSelectionBox(this.selectionBox, this.crossA, this.crossB);
                    }
                }
                onPointerDown(e) {
                    if (!this.twoPointsMode) {
                        this.capturingState = true;
                        this.baseParent.setPointerCapture(e.pointerId);
                        this.moveCross(this.crossB, this.crossA);
                        this.moveSelectionBox(this.selectionBox, this.crossA, this.crossB);
                        this.showAll([this.overlay, this.crossB, this.selectionBox]);
                        if (typeof this.onSelectionBeginCallback === "function") {
                            this.onSelectionBeginCallback();
                        }
                    }
                }
                onPointerUp(e) {
                    let rect = this.baseParent.getClientRects();
                    let p = new base.Point2D(e.clientX - rect[0].left, e.clientY - rect[0].top);
                    if (!this.twoPointsMode) {
                        this.capturingState = false;
                        this.baseParent.releasePointerCapture(e.pointerId);
                        this.hideAll([this.crossB, this.overlay]);
                        if (typeof this.onSelectionEndCallback === "function") {
                            this.onSelectionEndCallback(this.crossA.x, this.crossA.y, this.crossB.x, this.crossB.y);
                        }
                    }
                    else if (this.twoPointsMode && !this.capturingState) {
                        this.capturingState = true;
                        this.moveCross(this.crossB, p);
                        this.moveSelectionBox(this.selectionBox, this.crossA, this.crossB);
                        this.showAll([this.crossA, this.crossB, this.selectionBox, this.overlay]);
                        if (typeof this.onSelectionBeginCallback === "function") {
                            this.onSelectionBeginCallback();
                        }
                    }
                    else {
                        this.capturingState = false;
                        this.hideAll([this.crossB, this.overlay]);
                        if (typeof this.onSelectionEndCallback === "function") {
                            this.onSelectionEndCallback(this.crossA.x, this.crossA.y, this.crossB.x, this.crossB.y);
                        }
                        this.moveCross(this.crossA, p);
                        this.moveCross(this.crossB, p);
                    }
                }
                onPointerMove(e) {
                    let rect = this.baseParent.getClientRects();
                    let p = new base.Point2D(e.clientX - rect[0].left, e.clientY - rect[0].top);
                    this.crossA.show();
                    if (!this.twoPointsMode && !this.capturingState) {
                        this.moveCross(this.crossA, p);
                    }
                    else if (!this.twoPointsMode && this.capturingState) {
                        this.moveCross(this.crossB, p, this.squareMode, this.crossA);
                        this.moveSelectionBox(this.selectionBox, this.crossA, this.crossB);
                    }
                    else if (this.twoPointsMode && this.capturingState) {
                        this.moveCross(this.crossB, p, this.squareMode, this.crossA);
                        this.moveSelectionBox(this.selectionBox, this.crossA, this.crossB);
                    }
                    else {
                        this.moveCross(this.crossA, p);
                        this.moveCross(this.crossB, p);
                    }
                }
                onKeyDown(e) {
                    if (e.shiftKey) {
                        this.squareMode = true;
                    }
                    if (e.ctrlKey && !this.capturingState) {
                        this.twoPointsMode = true;
                    }
                }
                onKeyUp(e) {
                    if (!e.shiftKey) {
                        this.squareMode = false;
                    }
                    if (!e.ctrlKey && this.twoPointsMode) {
                        this.twoPointsMode = false;
                        this.capturingState = false;
                        this.moveCross(this.crossA, this.crossB);
                        this.hideAll([this.crossB, this.selectionBox, this.overlay]);
                    }
                }
                subscribeToEvents() {
                    let self = this;
                    let listeners = [
                        { event: "pointerenter", listener: this.onPointerEnter, base: this.baseParent },
                        { event: "pointerleave", listener: this.onPointerLeave, base: this.baseParent },
                        { event: "pointerdown", listener: this.onPointerDown, base: this.baseParent },
                        { event: "pointerup", listener: this.onPointerUp, base: this.baseParent },
                        { event: "pointermove", listener: this.onPointerMove, base: this.baseParent },
                        { event: "keydown", listener: this.onKeyDown, base: window },
                        { event: "keyup", listener: this.onKeyUp, base: window },
                    ];
                    listeners.forEach(e => {
                        e.base.addEventListener(e.event, this.enablify(e.listener.bind(this)));
                    });
                }
                moveCross(cross, p, square = false, refCross = null) {
                    cross.move(p, this.paperRect, square, refCross);
                }
                moveSelectionBox(box, crossA, crossB) {
                    var x = (crossA.x < crossB.x) ? crossA.x : crossB.x;
                    var y = (crossA.y < crossB.y) ? crossA.y : crossB.y;
                    var w = Math.abs(crossA.x - crossB.x);
                    var h = Math.abs(crossA.y - crossB.y);
                    box.move(new base.Point2D(x, y));
                    box.resize(w, h);
                }
                enable() {
                    this.isEnabled = true;
                    this.areaSelectorLayer.attr({
                        display: "block"
                    });
                }
                disable() {
                    this.isEnabled = false;
                    this.areaSelectorLayer.attr({
                        display: "none"
                    });
                }
                enablify(f) {
                    let self = this;
                    return function (args) {
                        if (this.isEnabled) {
                            f(args);
                        }
                    }.bind(self);
                }
            }
            Selection.AreaSelector = AreaSelector;
        })(Selection = CanvasTools.Selection || (CanvasTools.Selection = {}));
    })(CanvasTools = exports.CanvasTools || (exports.CanvasTools = {}));
});
//# sourceMappingURL=canvastools.js.map