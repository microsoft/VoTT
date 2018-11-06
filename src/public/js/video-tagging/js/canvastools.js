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
                copy() {
                    return new Rect(this.width, this.height);
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
            class Tag {
                constructor(name, colorHue, id = "none") {
                    this.__colorPure = "";
                    this.__colorAccent = "";
                    this.__colorHighlight = "";
                    this.__colorShadow = "";
                    this.__colorDark = "";
                    this.name = name;
                    this.colorHue = colorHue;
                    this.id = id;
                }
                get colorPure() {
                    if (this.__colorPure == "") {
                        this.__colorPure = `hsl(${this.colorHue.toString()}, 100%, 50%)`;
                    }
                    return this.__colorPure;
                }
                get colorAccent() {
                    if (this.__colorAccent == "") {
                        this.__colorAccent = `hsla(${this.colorHue.toString()}, 100%, 50%, 0.5)`;
                    }
                    return this.__colorAccent;
                }
                get colorHighlight() {
                    if (this.__colorHighlight == "") {
                        this.__colorHighlight = `hsla(${this.colorHue.toString()}, 80%, 40%, 0.3)`;
                    }
                    return this.__colorHighlight;
                }
                get colorShadow() {
                    if (this.__colorShadow == "") {
                        this.__colorShadow = `hsla(${this.colorHue.toString()}, 50%, 30%, 0.2)`;
                    }
                    return this.__colorShadow;
                }
                get colorDark() {
                    if (this.__colorDark == "") {
                        this.__colorDark = `hsla(${this.colorHue.toString()}, 50%, 30%, 0.8)`;
                    }
                    return this.__colorDark;
                }
                static getHueFromColor(color) {
                    var r = parseInt(color.substring(1, 3), 16) / 255;
                    var g = parseInt(color.substring(3, 5), 16) / 255;
                    var b = parseInt(color.substring(5, 7), 16) / 255;
                    var max = Math.max(r, g, b), min = Math.min(r, g, b);
                    var h, s, l = (max + min) / 2;
                    if (max == min) {
                        h = s = 0;
                    }
                    else {
                        var d = max - min;
                        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                        switch (max) {
                            case r:
                                h = (g - b) / d + (g < b ? 6 : 0);
                                break;
                            case g:
                                h = (b - r) / d + 2;
                                break;
                            case b:
                                h = (r - g) / d + 4;
                                break;
                        }
                        h /= 6;
                    }
                    return h;
                }
            }
            Base.Tag = Tag;
            class TagsDescriptor {
                constructor(primaryTag, secondaryTags = []) {
                    this.primary = primaryTag;
                    this.secondary = secondaryTags;
                }
            }
            Base.TagsDescriptor = TagsDescriptor;
        })(Base = CanvasTools.Base || (CanvasTools.Base = {}));
    })(CanvasTools = exports.CanvasTools || (exports.CanvasTools = {}));
});
define("filtertool", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var CanvasTools;
    (function (CanvasTools) {
        var Filter;
        (function (Filter) {
            function InvertFilter(canvas) {
                var context = canvas.getContext('2d');
                var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                var buff = document.createElement("canvas");
                buff.width = canvas.width;
                buff.height = canvas.height;
                var data = imageData.data;
                for (var i = 0; i < data.length; i += 4) {
                    data[i] = 255 - data[i];
                    data[i + 1] = 255 - data[i + 1];
                    data[i + 2] = 255 - data[i + 2];
                }
                buff.getContext("2d").putImageData(imageData, 0, 0);
                return new Promise((resolve, reject) => {
                    return resolve(buff);
                });
            }
            Filter.InvertFilter = InvertFilter;
            class FilterPipeline {
                constructor() {
                    this.pipeline = new Array();
                }
                addFilter(filter) {
                    this.pipeline.push(filter);
                }
                clearPipeline() {
                    this.pipeline = new Array();
                }
                applyToCanvas(canvas) {
                    let promise = new Promise((resolve, reject) => {
                        return resolve(canvas);
                    });
                    if (this.pipeline.length > 0) {
                        this.pipeline.forEach((filter) => {
                            promise = promise.then(filter);
                        });
                    }
                    return promise;
                }
            }
            Filter.FilterPipeline = FilterPipeline;
        })(Filter = CanvasTools.Filter || (CanvasTools.Filter = {}));
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
            class AnchorsElement {
                constructor(paper, x, y, rect, boundRect = null, onChange, onManipulationBegin, onManipulationEnd) {
                    this.x = x;
                    this.y = y;
                    this.rect = rect;
                    this.boundRect = boundRect;
                    if (onChange !== undefined) {
                        this.onChange = onChange;
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
                buildOn(paper) {
                    this.anchorsGroup = paper.g();
                    this.anchorsGroup.addClass("anchorsLayer");
                    this.anchors = {
                        TL: this.createAnchor(paper, "TL"),
                        TR: this.createAnchor(paper, "TR"),
                        BL: this.createAnchor(paper, "BL"),
                        BR: this.createAnchor(paper, "BR")
                    };
                    this.ghostAnchor = this.createAnchor(paper, "ghost", 7);
                    this.rearrangeAnchors(this.x, this.y, this.x + this.rect.width, this.y + this.rect.height);
                    this.anchorsGroup.add(this.anchors.TL);
                    this.anchorsGroup.add(this.anchors.TR);
                    this.anchorsGroup.add(this.anchors.BR);
                    this.anchorsGroup.add(this.anchors.BL);
                    this.anchorsGroup.add(this.ghostAnchor);
                }
                createAnchor(paper, style = "", r = 3) {
                    let a = paper.circle(0, 0, r);
                    a.addClass("anchorStyle");
                    a.addClass(style);
                    return a;
                }
                move(p) {
                    this.x = p.x;
                    this.y = p.y;
                    this.rearrangeAnchors(this.x, this.y, this.x + this.rect.width, this.y + this.rect.height);
                }
                resize(width, height) {
                    this.rect.width = width;
                    this.rect.height = height;
                    this.rearrangeAnchors(this.x, this.y, this.x + this.rect.width, this.y + this.rect.height);
                }
                rearrangeAnchors(x1, y1, x2, y2) {
                    window.requestAnimationFrame(() => {
                        this.anchors.TL.attr({ cx: x1, cy: y1 });
                        this.anchors.TR.attr({ cx: x2, cy: y1 });
                        this.anchors.BR.attr({ cx: x2, cy: y2 });
                        this.anchors.BL.attr({ cx: x1, cy: y2 });
                    });
                }
                rearrangeCoord(p1, p2, flipX, flipY) {
                    let x = (p1.x < p2.x) ? p1.x : p2.x;
                    let y = (p1.y < p2.y) ? p1.y : p2.y;
                    let width = Math.abs(p1.x - p2.x);
                    let height = Math.abs(p1.y - p2.y);
                    this.flipActiveAnchor(flipX, flipY);
                    this.onChange(x, y, width, height, "moving");
                }
                flipActiveAnchor(flipX, flipY) {
                    let ac = "";
                    if (this.activeAnchor !== "") {
                        ac += (this.activeAnchor[0] == "T") ? (flipY ? "B" : "T") : (flipY ? "T" : "B");
                        ac += (this.activeAnchor[1] == "L") ? (flipX ? "R" : "L") : (flipX ? "L" : "R");
                    }
                    if (this.activeAnchor != ac) {
                        this.ghostAnchor.removeClass(this.activeAnchor);
                        this.activeAnchor = ac;
                        this.ghostAnchor.addClass(this.activeAnchor);
                    }
                    if (flipX) {
                        if (this.activeAnchor[1] == "R") {
                            this.pointOrigin.x += this.rectOrigin.width;
                        }
                        this.rectOrigin.width = 0;
                    }
                    if (flipY) {
                        if (this.activeAnchor[0] == "B") {
                            this.pointOrigin.y += this.rectOrigin.height;
                        }
                        this.rectOrigin.height = 0;
                    }
                }
                anchorDragBegin() {
                    this.originalAnchor = this.activeAnchor;
                }
                getDragOriginPoint() {
                    let x, y;
                    switch (this.activeAnchor) {
                        case "TL": {
                            x = this.x;
                            y = this.y;
                            break;
                        }
                        case "TR": {
                            x = this.x + this.rect.width;
                            y = this.y;
                            break;
                        }
                        case "BL": {
                            x = this.x;
                            y = this.y + this.rect.height;
                            break;
                        }
                        case "BR": {
                            x = this.x + this.rect.width;
                            y = this.y + this.rect.height;
                            break;
                        }
                    }
                    return new base.Point2D(x, y);
                }
                anchorDragMove(dx, dy, x, y) {
                    let p1, p2;
                    let x1, y1, x2, y2;
                    let flipX = false;
                    let flipY = false;
                    x1 = this.dragOrigin.x + dx;
                    y1 = this.dragOrigin.y + dy;
                    switch (this.activeAnchor) {
                        case "TL": {
                            x2 = this.pointOrigin.x + this.rectOrigin.width;
                            y2 = this.pointOrigin.y + this.rectOrigin.height;
                            flipX = x2 < x1;
                            flipY = y2 < y1;
                            break;
                        }
                        case "TR": {
                            x2 = this.pointOrigin.x;
                            y2 = this.pointOrigin.y + this.rectOrigin.height;
                            flipX = x1 < x2;
                            flipY = y2 < y1;
                            break;
                        }
                        case "BL": {
                            y2 = this.pointOrigin.y;
                            x2 = this.pointOrigin.x + this.rectOrigin.width;
                            flipX = x2 < x1;
                            flipY = y1 < y2;
                            break;
                        }
                        case "BR": {
                            x2 = this.pointOrigin.x;
                            y2 = this.pointOrigin.y;
                            flipX = x1 < x2;
                            flipY = y1 < y2;
                            break;
                        }
                    }
                    p1 = new base.Point2D(x1, y1);
                    p2 = new base.Point2D(x2, y2);
                    if (this.boundRect !== null) {
                        p1 = p1.boundToRect(this.boundRect);
                        p2 = p2.boundToRect(this.boundRect);
                    }
                    window.requestAnimationFrame(() => {
                        this.ghostAnchor.attr({ cx: x1, cy: y1 });
                    });
                    this.rearrangeCoord(p1, p2, flipX, flipY);
                }
                ;
                anchorDragEnd() {
                    window.requestAnimationFrame(() => {
                        this.ghostAnchor.attr({
                            display: "none"
                        });
                    });
                }
                subscribeToEvents() {
                    let self = this;
                    this.subscribeAnchorToEvents(this.anchors.TL, "TL");
                    this.subscribeAnchorToEvents(this.anchors.TR, "TR");
                    this.subscribeAnchorToEvents(this.anchors.BL, "BL");
                    this.subscribeAnchorToEvents(this.anchors.BR, "BR");
                    self.ghostAnchor.mouseover(function (e) {
                        self.ghostAnchor.drag(self.anchorDragMove.bind(self), self.anchorDragBegin.bind(self), self.anchorDragEnd.bind(self));
                        window.requestAnimationFrame(() => {
                            self.ghostAnchor.addClass(self.activeAnchor);
                        });
                        self.onManipulationBegin();
                    });
                    self.ghostAnchor.mouseout(function (e) {
                        self.ghostAnchor.undrag();
                        window.requestAnimationFrame(() => {
                            self.ghostAnchor.attr({
                                display: "none"
                            });
                            self.ghostAnchor.removeClass(self.activeAnchor);
                        });
                        self.onManipulationEnd();
                    });
                    self.ghostAnchor.node.addEventListener("pointerdown", function (e) {
                        self.ghostAnchor.node.setPointerCapture(e.pointerId);
                        self.onChange(self.x, self.y, self.rect.width, self.rect.height, "movingbegin");
                    });
                    self.ghostAnchor.node.addEventListener("pointerup", function (e) {
                        self.ghostAnchor.node.releasePointerCapture(e.pointerId);
                        self.onChange(self.x, self.y, self.rect.width, self.rect.height, "movingend");
                    });
                }
                subscribeAnchorToEvents(anchor, active) {
                    anchor.mouseover((e) => {
                        this.activeAnchor = active;
                        let p = this.getDragOriginPoint();
                        this.dragOrigin = p;
                        this.rectOrigin = this.rect.copy();
                        this.pointOrigin = new base.Point2D(this.x, this.y);
                        window.requestAnimationFrame(() => {
                            this.ghostAnchor.attr({
                                cx: p.x,
                                cy: p.y,
                                display: 'block'
                            });
                        });
                    });
                }
                hide() {
                    window.requestAnimationFrame(() => {
                        this.anchorsGroup.attr({
                            visibility: 'hidden'
                        });
                    });
                }
                show() {
                    window.requestAnimationFrame(() => {
                        this.anchorsGroup.attr({
                            visibility: 'visible'
                        });
                    });
                }
            }
            class TagsElement {
                constructor(paper, x, y, rect, tags, styleId, styleSheet) {
                    this.styleSheet = null;
                    this.rect = rect;
                    this.x = x;
                    this.y = y;
                    this.styleId = styleId;
                    this.styleSheet = styleSheet;
                    this.paper = paper;
                    this.buildOn(paper, tags);
                }
                buildOn(paper, tags) {
                    this.tagsGroup = paper.g();
                    this.tagsGroup.addClass("tagsLayer");
                    this.primaryTagRect = paper.rect(0, 0, this.rect.width, this.rect.height);
                    this.primaryTagRect.addClass("primaryTagRectStyle");
                    this.primaryTagText = paper.text(0, 0, "");
                    this.primaryTagText.addClass("primaryTagTextStyle");
                    this.textBox = this.primaryTagText.getBBox();
                    this.primaryTagTextBG = paper.rect(0, 0, 0, 0);
                    this.primaryTagTextBG.addClass("primaryTagTextBGStyle");
                    this.secondaryTagsGroup = paper.g();
                    this.secondaryTagsGroup.addClass("secondatyTagsLayer");
                    this.secondaryTags = [];
                    this.tagsGroup.add(this.primaryTagRect);
                    this.tagsGroup.add(this.primaryTagTextBG);
                    this.tagsGroup.add(this.primaryTagText);
                    this.tagsGroup.add(this.secondaryTagsGroup);
                    this.updateTags(tags);
                }
                updateTags(tags) {
                    let keepPrimaryText = false;
                    if (this.tags && this.tags.primary && tags && tags.primary) {
                        keepPrimaryText = (tags.primary.name == this.tags.primary.name);
                    }
                    this.tags = tags;
                    this.redrawTagLabels(keepPrimaryText);
                    this.clearColors();
                    this.applyColors();
                }
                redrawTagLabels(keepPrimaryText = true) {
                    for (let i = 0; i < this.secondaryTags.length; i++) {
                        this.secondaryTags[i].remove();
                    }
                    this.secondaryTags = [];
                    if (this.tags) {
                        if (this.tags.primary !== undefined) {
                            if (!keepPrimaryText || this.textBox == undefined) {
                                this.primaryTagText.node.innerHTML = this.tags.primary.name;
                                this.textBox = this.primaryTagText.getBBox();
                            }
                            let showTextLabel = (this.textBox.width + 10 <= this.rect.width) && (this.textBox.height <= this.rect.height);
                            if (showTextLabel) {
                                window.requestAnimationFrame(() => {
                                    this.primaryTagTextBG.attr({
                                        width: this.textBox.width + 10,
                                        height: this.textBox.height + 5
                                    });
                                    this.primaryTagText.attr({
                                        x: this.x + 5,
                                        y: this.y + this.textBox.height,
                                        visibility: "visible"
                                    });
                                });
                            }
                            else {
                                window.requestAnimationFrame(() => {
                                    this.primaryTagTextBG.attr({
                                        width: Math.min(10, this.rect.width),
                                        height: Math.min(10, this.rect.height)
                                    });
                                    this.primaryTagText.attr({
                                        x: this.x + 5,
                                        y: this.y + this.textBox.height,
                                        visibility: "hidden"
                                    });
                                });
                            }
                        }
                        if (this.tags.secondary && this.tags.secondary.length > 0) {
                            let length = this.tags.secondary.length;
                            for (let i = 0; i < length; i++) {
                                let stag = this.tags.secondary[i];
                                let s = 6;
                                let x = this.x + this.rect.width / 2 + (2 * i - length + 1) * s - s / 2;
                                let y = this.y - s - 5;
                                let tagel = this.paper.rect(x, y, s, s);
                                window.requestAnimationFrame(() => {
                                    tagel.addClass("secondaryTagStyle");
                                    tagel.addClass(`secondaryTag-${stag.name}`);
                                });
                                this.secondaryTagsGroup.add(tagel);
                                this.secondaryTags.push(tagel);
                            }
                        }
                    }
                    else {
                        window.requestAnimationFrame(() => {
                            this.primaryTagText.node.innerHTML = "";
                            this.primaryTagTextBG.attr({
                                width: 0,
                                height: 0
                            });
                        });
                    }
                }
                clearColors() {
                    while (this.styleSheet.cssRules.length > 0) {
                        this.styleSheet.deleteRule(0);
                    }
                }
                applyColors() {
                    if (this.tags && this.tags.primary !== undefined) {
                        let styleMap = [
                            {
                                rule: `.${this.styleId} .primaryTagRectStyle`,
                                style: `fill: ${this.tags.primary.colorShadow};
                                stroke:${this.tags.primary.colorAccent};`
                            },
                            {
                                rule: `.regionStyle.${this.styleId}:hover  .primaryTagRectStyle`,
                                style: `fill: ${this.tags.primary.colorHighlight}; 
                                stroke: #fff;`
                            },
                            {
                                rule: `.regionStyle.selected.${this.styleId} .primaryTagRectStyle`,
                                style: `fill: ${this.tags.primary.colorHighlight};
                                stroke:${this.tags.primary.colorAccent};`
                            },
                            {
                                rule: `.regionStyle.${this.styleId} .anchorStyle`,
                                style: `stroke:${this.tags.primary.colorDark};
                                fill: ${this.tags.primary.colorPure}`
                            },
                            {
                                rule: `.regionStyle.${this.styleId}:hover .anchorStyle`,
                                style: `stroke:#fff;`
                            },
                            {
                                rule: `.regionStyle.${this.styleId} .anchorStyle.ghost`,
                                style: `fill:transparent;`
                            },
                            {
                                rule: `.regionStyle.${this.styleId} .anchorStyle.ghost:hover`,
                                style: `fill:rgba(255,255,255,0.5);`
                            },
                            {
                                rule: `.regionStyle.${this.styleId} .primaryTagTextBGStyle`,
                                style: `fill:${this.tags.primary.colorAccent};`
                            },
                        ];
                        window.requestAnimationFrame(() => {
                            for (let i = 0; i < styleMap.length; i++) {
                                let r = styleMap[i];
                                this.styleSheet.insertRule(`${r.rule}{${r.style}}`, 0);
                            }
                            if (this.tags && this.tags.secondary.length > 0) {
                                for (let i = 0; i < this.tags.secondary.length; i++) {
                                    let tag = this.tags.secondary[i];
                                    let rule = `.secondaryTagStyle.secondaryTag-${tag.name}{
                                fill: ${tag.colorAccent};
                            }`;
                                    this.styleSheet.insertRule(rule, 0);
                                }
                            }
                        });
                    }
                }
                move(p) {
                    this.x = p.x;
                    this.y = p.y;
                    let size = 6;
                    let cx = this.x + 0.5 * this.rect.width;
                    let cy = this.y - size - 5;
                    window.requestAnimationFrame(() => {
                        this.primaryTagRect.attr({
                            x: p.x,
                            y: p.y
                        });
                        this.primaryTagText.attr({
                            x: p.x + 5,
                            y: p.y + this.textBox.height
                        });
                        this.primaryTagTextBG.attr({
                            x: p.x + 1,
                            y: p.y + 1
                        });
                        if (this.secondaryTags && this.secondaryTags.length > 0) {
                            let length = this.secondaryTags.length;
                            for (let i = 0; i < length; i++) {
                                let stag = this.secondaryTags[i];
                                let x = cx + (2 * i - length + 0.5) * size;
                                stag.attr({
                                    x: x,
                                    y: cy
                                });
                            }
                        }
                    });
                }
                resize(width, height) {
                    this.rect.width = width;
                    this.rect.height = height;
                    window.requestAnimationFrame(() => {
                        this.primaryTagRect.attr({
                            width: width,
                            height: height
                        });
                    });
                    this.redrawTagLabels();
                }
                hide() {
                    window.requestAnimationFrame(() => {
                        this.tagsGroup.attr({
                            visibility: 'hidden'
                        });
                    });
                }
                show() {
                    window.requestAnimationFrame(() => {
                        this.tagsGroup.attr({
                            visibility: 'visible'
                        });
                    });
                }
            }
            class DragElement {
                constructor(paper, x, y, rect, boundRect = null, onChange, onManipulationBegin, onManipulationEnd) {
                    this.rect = rect;
                    this.x = x;
                    this.y = y;
                    this.boundRect = boundRect;
                    if (onChange !== undefined) {
                        this.onChange = onChange;
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
                buildOn(paper) {
                    this.dragGroup = paper.g();
                    this.dragGroup.addClass("dragLayer");
                    this.dragRect = paper.rect(0, 0, this.rect.width, this.rect.height);
                    this.dragRect.addClass("dragRectStyle");
                    this.dragGroup.add(this.dragRect);
                }
                move(p) {
                    this.x = p.x;
                    this.y = p.y;
                    window.requestAnimationFrame(() => {
                        this.dragRect.attr({
                            x: p.x,
                            y: p.y
                        });
                    });
                }
                resize(width, height) {
                    this.rect.width = width;
                    this.rect.height = height;
                    window.requestAnimationFrame(() => {
                        this.dragRect.attr({
                            width: width,
                            height: height
                        });
                    });
                }
                hide() {
                    window.requestAnimationFrame(() => {
                        this.dragRect.attr({
                            visibility: 'hidden'
                        });
                    });
                }
                show() {
                    window.requestAnimationFrame(() => {
                        this.dragRect.attr({
                            visibility: 'visible'
                        });
                    });
                }
                rectDragBegin() {
                    this.dragOrigin = new base.Point2D(this.x, this.y);
                }
                rectDragMove(dx, dy) {
                    if (dx != 0 && dy != 0) {
                        let p = new base.Point2D(this.dragOrigin.x + dx, this.dragOrigin.y + dy);
                        if (this.boundRect !== null) {
                            p = p.boundToRect(this.boundRect);
                        }
                        this.onChange(p.x, p.y, this.rect.width, this.rect.height, "moving");
                    }
                }
                ;
                rectDragEnd() {
                    this.dragOrigin = null;
                    this.onChange(this.x, this.y, this.rect.width, this.rect.height, "movingend");
                }
                subscribeToEvents() {
                    let self = this;
                    self.dragRect.mouseover(function (e) {
                        self.dragRect.drag(self.rectDragMove.bind(self), self.rectDragBegin.bind(self), self.rectDragEnd.bind(self));
                        self.onManipulationBegin();
                    });
                    self.dragRect.mouseout(function (e) {
                        self.dragRect.undrag();
                        self.onManipulationEnd();
                    });
                    self.dragRect.node.addEventListener("pointerdown", function (e) {
                        self.dragRect.node.setPointerCapture(e.pointerId);
                        let multiselection = e.shiftKey;
                        self.onChange(self.x, self.y, self.rect.width, self.rect.height, "movingbegin", multiselection);
                    });
                    self.dragRect.node.addEventListener("pointerup", function (e) {
                        self.dragRect.node.releasePointerCapture(e.pointerId);
                        let multiselection = e.shiftKey;
                        self.onChange(self.x, self.y, self.rect.width, self.rect.height, "clicked", multiselection);
                    });
                }
            }
            class MenuElement {
                constructor(paper, x, y, rect, boundRect = null, onManipulationBegin, onManipulationEnd) {
                    this.menuItemSize = 20;
                    this.mw = this.menuItemSize + 10;
                    this.mh = 60;
                    this.dh = 20;
                    this.dw = 5;
                    this.pathCollection = {
                        "delete": {
                            path: "M 83.4 21.1 L 74.9 12.6 L 48 39.5 L 21.1 12.6 L 12.6 21.1 L 39.5 48 L 12.6 74.9 L 21.1 83.4 L 48 56.5 L 74.9 83.4 L 83.4 74.9 L 56.5 48 Z",
                            iconSize: 96
                        }
                    };
                    this.paper = paper;
                    this.rect = rect;
                    this.x = x;
                    this.y = y;
                    this.boundRect = boundRect;
                    if (onManipulationBegin !== undefined) {
                        this.onManipulationBegin = onManipulationBegin;
                    }
                    if (onManipulationEnd !== undefined) {
                        this.onManipulationEnd = onManipulationEnd;
                    }
                    this.buildOn(this.paper);
                }
                buildOn(paper) {
                    let menuSVG = this.paper.svg(this.mx, this.my, this.mw, this.mh, this.mx, this.my, this.mw, this.mh);
                    this.menuGroup = Snap(menuSVG).paper;
                    this.menuGroup.addClass("menuLayer");
                    this.rearrangeMenuPosition();
                    this.menuRect = this.menuGroup.rect(0, 0, this.mw, this.mh, 5, 5);
                    this.menuRect.addClass("menuRectStyle");
                    this.menuItemsGroup = this.menuGroup.g();
                    this.menuItemsGroup.addClass("menuItems");
                    this.menuItems = new Array();
                    this.menuGroup.add(this.menuRect);
                    this.menuGroup.add(this.menuItemsGroup);
                    this.menuGroup.mouseover((e) => {
                        this.onManipulationBegin();
                    });
                    this.menuGroup.mouseout((e) => {
                        this.onManipulationEnd();
                    });
                }
                addAction(action, icon, actor) {
                    let item = this.menuGroup.g();
                    let itemBack = this.menuGroup.rect(5, 5, this.menuItemSize, this.menuItemSize, 5, 5);
                    itemBack.addClass("menuItemBack");
                    let k = (this.menuItemSize - 4) / this.pathCollection.delete.iconSize;
                    let itemIcon = this.menuGroup.path(this.pathCollection.delete.path);
                    itemIcon.transform(`scale(0.2) translate(26 26)`);
                    itemIcon.addClass("menuIcon");
                    itemIcon.addClass("menuIcon-" + icon);
                    let itemRect = this.menuGroup.rect(5, 5, this.menuItemSize, this.menuItemSize, 5, 5);
                    itemRect.addClass("menuItem");
                    item.add(itemBack);
                    item.add(itemIcon);
                    item.add(itemRect);
                    item.click((e) => {
                        actor(this.region);
                    });
                    this.menuItemsGroup.add(item);
                    this.menuItems.push(item);
                }
                rearrangeMenuPosition() {
                    if (this.mh <= this.rect.height - this.dh) {
                        this.my = this.y + this.rect.height / 2 - this.mh / 2;
                        if (this.x + this.rect.width + this.mw / 2 + this.dw < this.boundRect.width) {
                            this.mx = this.x + this.rect.width - this.mw / 2;
                        }
                        else if (this.x - this.mw / 2 - this.dw > 0) {
                            this.mx = this.x - this.mw / 2;
                        }
                        else {
                            this.mx = this.x + this.rect.width - this.mw - this.dw;
                        }
                    }
                    else {
                        this.my = this.y;
                        if (this.x + this.rect.width + this.mw + 2 * this.dw < this.boundRect.width) {
                            this.mx = this.x + this.rect.width + this.dw;
                        }
                        else if (this.x - this.mw - 2 * this.dw > 0) {
                            this.mx = this.x - this.mw - this.dw;
                        }
                        else {
                            this.mx = this.x + this.rect.width - this.mw - this.dw;
                        }
                    }
                }
                attachTo(region) {
                    this.region = region;
                    this.x = region.x;
                    this.y = region.y;
                    this.rect = region.rect;
                    this.rearrangeMenuPosition();
                    window.requestAnimationFrame(() => {
                        this.menuGroup.attr({
                            x: this.mx,
                            y: this.my
                        });
                    });
                }
                move(p) {
                    let self = this;
                    this.x = p.x;
                    this.y = p.y;
                    this.rearrangeMenuPosition();
                    window.requestAnimationFrame(() => {
                        this.menuGroup.attr({
                            x: this.mx,
                            y: this.my
                        });
                    });
                }
                resize(width, height) {
                    let self = this;
                    this.rect.width = width;
                    this.rect.height = height;
                    this.rearrangeMenuPosition();
                    window.requestAnimationFrame(() => {
                        this.menuGroup.attr({
                            x: this.mx,
                            y: this.my
                        });
                    });
                }
                hide() {
                    window.requestAnimationFrame(() => {
                        this.menuGroup.attr({
                            visibility: 'hidden'
                        });
                    });
                }
                show() {
                    window.requestAnimationFrame(() => {
                        this.menuGroup.attr({
                            visibility: 'visible'
                        });
                    });
                }
                showOnRegion(region) {
                    this.attachTo(region);
                    this.show();
                }
            }
            class RegionElement {
                constructor(paper, rect, boundRect = null, id, tagsDescriptor, onManipulationBegin, onManipulationEnd) {
                    this.isSelected = false;
                    this.styleSheet = null;
                    this.x = 0;
                    this.y = 0;
                    this.rect = rect;
                    this.ID = id;
                    this.tagsDescriptor = tagsDescriptor;
                    if (boundRect !== null) {
                        this.boundRects = {
                            host: boundRect,
                            self: new base.Rect(boundRect.width - rect.width, boundRect.height - rect.height)
                        };
                    }
                    if (onManipulationBegin !== undefined) {
                        this.onManipulationBegin = () => {
                            onManipulationBegin(this);
                        };
                    }
                    if (onManipulationEnd !== undefined) {
                        this.onManipulationEnd = () => {
                            onManipulationEnd(this);
                        };
                    }
                    this.regionID = this.s8();
                    this.styleID = `region_${this.regionID}_style`;
                    this.styleSheet = this.insertStyleSheet();
                    this.buildOn(paper);
                }
                buildOn(paper) {
                    this.regionGroup = paper.g();
                    this.regionGroup.addClass("regionStyle");
                    this.regionGroup.addClass(this.styleID);
                    this.anchors = new AnchorsElement(paper, this.x, this.y, this.rect, this.boundRects.host, this.onInternalChange.bind(this), this.onManipulationBegin, this.onManipulationEnd);
                    this.drag = new DragElement(paper, this.x, this.y, this.rect, this.boundRects.self, this.onInternalChange.bind(this), this.onManipulationBegin, this.onManipulationEnd);
                    this.tags = new TagsElement(paper, this.x, this.y, this.rect, this.tagsDescriptor, this.styleID, this.styleSheet);
                    this.regionGroup.add(this.tags.tagsGroup);
                    this.regionGroup.add(this.drag.dragGroup);
                    this.regionGroup.add(this.anchors.anchorsGroup);
                    this.UI = new Array(this.tags, this.drag, this.anchors);
                }
                s8() {
                    return Math.floor((1 + Math.random()) * 0x100000000)
                        .toString(16)
                        .substring(1);
                }
                insertStyleSheet() {
                    var style = document.createElement("style");
                    style.setAttribute("id", this.styleID);
                    document.head.appendChild(style);
                    return style.sheet;
                }
                removeStyles() {
                    document.getElementById(this.styleID).remove();
                }
                onInternalChange(x, y, width, height, state, multiSelection = false) {
                    if (this.x != x || this.y != y) {
                        this.move(new base.Point2D(x, y));
                    }
                    if (this.rect.width != width || this.rect.height != height) {
                        this.resize(width, height);
                    }
                    this.onChange(this, state, multiSelection);
                }
                updateTags(tags) {
                    this.tags.updateTags(tags);
                }
                move(p) {
                    let self = this;
                    this.x = p.x;
                    this.y = p.y;
                    this.UI.forEach((element) => {
                        element.move(p);
                    });
                }
                resize(width, height) {
                    this.rect.width = width;
                    this.rect.height = height;
                    this.area = width * height;
                    this.boundRects.self.width = this.boundRects.host.width - width;
                    this.boundRects.self.height = this.boundRects.host.height - height;
                    this.UI.forEach((element) => {
                        element.resize(width, height);
                    });
                }
                hide() {
                    window.requestAnimationFrame(() => {
                        this.regionGroup.attr({
                            visibility: 'hidden'
                        });
                    });
                }
                show() {
                    window.requestAnimationFrame(() => {
                        this.regionGroup.attr({
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
            }
            class RegionsManager {
                constructor(svgHost, onManipulationBegin, onManipulationEnd) {
                    this.justManipulated = false;
                    this.baseParent = svgHost;
                    this.paper = Snap(svgHost);
                    this.paperRect = new base.Rect(svgHost.width.baseVal.value, svgHost.height.baseVal.value);
                    this.regions = new Array();
                    this.onManipulationBegin = onManipulationBegin;
                    this.onManipulationEnd = onManipulationEnd;
                    this.buildOn(this.paper);
                    this.subscribeToEvents();
                }
                buildOn(paper) {
                    this.regionManagerLayer = paper.g();
                    this.regionManagerLayer.addClass("regionManager");
                    this.menuLayer = paper.g();
                    this.menuLayer.addClass("menuManager");
                    this.menu = new MenuElement(paper, 0, 0, new base.Rect(0, 0), this.paperRect, this.onManipulationBegin_local.bind(this), this.onManipulationEnd_local.bind(this));
                    this.menu.addAction("delete", "trash", (region) => {
                        console.log(region.regionID);
                        this.deleteRegion(region);
                        this.menu.hide();
                    });
                    this.menuLayer.add(this.menu.menuGroup);
                    this.menu.hide();
                }
                subscribeToEvents() {
                    window.addEventListener("keyup", (e) => {
                        switch (e.keyCode) {
                            case 9:
                                this.selectNextRegion();
                                break;
                            case 46:
                            case 8:
                                this.deleteSelectedRegions();
                                break;
                            case 38:
                                if (e.ctrlKey) {
                                    if (!e.shiftKey && !e.altKey) {
                                        this.moveSelectedRegions(0, -5);
                                    }
                                    else if (e.shiftKey && !e.altKey) {
                                        this.resizeSelectedRegions(0, -5);
                                    }
                                    else if (e.altKey && !e.shiftKey) {
                                        this.resizeSelectedRegions(0, -5, true);
                                    }
                                }
                                break;
                            case 40:
                                if (e.ctrlKey) {
                                    if (!e.shiftKey && !e.altKey) {
                                        this.moveSelectedRegions(0, 5);
                                    }
                                    else if (e.shiftKey && !e.altKey) {
                                        this.resizeSelectedRegions(0, 5);
                                    }
                                    else if (e.altKey && !e.shiftKey) {
                                        this.resizeSelectedRegions(0, 5, true);
                                    }
                                }
                                break;
                            case 37:
                                if (e.ctrlKey) {
                                    if (!e.shiftKey && !e.altKey) {
                                        this.moveSelectedRegions(-5, 0);
                                    }
                                    else if (e.shiftKey && !e.altKey) {
                                        this.resizeSelectedRegions(-5, 0);
                                    }
                                    else if (e.altKey && !e.shiftKey) {
                                        this.resizeSelectedRegions(-5, 0, true);
                                    }
                                }
                                break;
                            case 39:
                                if (e.ctrlKey) {
                                    if (!e.shiftKey && !e.altKey) {
                                        this.moveSelectedRegions(5, 0);
                                    }
                                    else if (e.shiftKey && !e.altKey) {
                                        this.resizeSelectedRegions(5, 0);
                                    }
                                    else if (e.altKey && !e.shiftKey) {
                                        this.resizeSelectedRegions(5, 0, true);
                                    }
                                }
                                break;
                            default: return;
                        }
                        e.preventDefault();
                    });
                    window.addEventListener("keydown", (e) => {
                        switch (e.keyCode) {
                            case 65:
                            case 97:
                                if (e.ctrlKey) {
                                    this.selectAllRegions();
                                    e.preventDefault();
                                    return false;
                                }
                                break;
                            default: return;
                        }
                    });
                }
                addRegion(id, pointA, pointB, tagsDescriptor) {
                    this.menu.hide();
                    let x = (pointA.x < pointB.x) ? pointA.x : pointB.x;
                    let y = (pointA.y < pointB.y) ? pointA.y : pointB.y;
                    let w = Math.abs(pointA.x - pointB.x);
                    let h = Math.abs(pointA.y - pointB.y);
                    let region = new RegionElement(this.paper, new base.Rect(w, h), this.paperRect, id, tagsDescriptor, this.onManipulationBegin_local.bind(this), this.onManipulationEnd_local.bind(this));
                    region.move(new base.Point2D(x, y));
                    region.onChange = this.onRegionUpdate.bind(this);
                    this.unselectRegions();
                    region.select();
                    this.regionManagerLayer.add(region.regionGroup);
                    this.regions.push(region);
                    this.menu.showOnRegion(region);
                }
                drawRegion(x, y, rect, id, tagsDescriptor) {
                    this.menu.hide();
                    let region = new RegionElement(this.paper, rect, this.paperRect, id, tagsDescriptor, this.onManipulationBegin_local.bind(this), this.onManipulationEnd_local.bind(this));
                    region.area = rect.height * rect.width;
                    region.move(new base.Point2D(x, y));
                    region.onChange = this.onRegionUpdate.bind(this);
                    region.tags.updateTags(region.tags.tags);
                    this.regionManagerLayer.add(region.regionGroup);
                    this.regions.push(region);
                    if (this.regions.length > 1 && region.area > this.regions[this.regions.length - 2].area) {
                        this.sortRegionsByArea();
                        this.redrawAllRegions();
                    }
                    this.menu.showOnRegion(region);
                }
                redrawAllRegions() {
                    let sr = this.regions;
                    this.deleteAllRegions();
                    for (var i = 0; i < sr.length; i++) {
                        this.drawRegion(sr[i].x, sr[i].y, sr[i].rect, sr[i].ID, sr[i].tags.tags);
                        if (sr[i].isSelected) {
                            this.selectRegionById(sr[i].ID);
                        }
                    }
                }
                sortRegionsByArea() {
                    function quickSort(arr, left, right) {
                        var len = arr.length, pivot, partitionIndex;
                        if (left < right) {
                            pivot = right;
                            partitionIndex = partition(arr, pivot, left, right);
                            quickSort(arr, left, partitionIndex - 1);
                            quickSort(arr, partitionIndex + 1, right);
                        }
                        return arr;
                    }
                    function partition(arr, pivot, left, right) {
                        var pivotValue = arr[pivot].area, partitionIndex = left;
                        for (var i = left; i < right; i++) {
                            if (arr[i].area > pivotValue) {
                                swap(arr, i, partitionIndex);
                                partitionIndex++;
                            }
                        }
                        swap(arr, right, partitionIndex);
                        return partitionIndex;
                    }
                    function swap(arr, i, j) {
                        var temp = arr[i];
                        arr[i] = arr[j];
                        arr[j] = temp;
                    }
                    let length = this.regions.length;
                    if (length > 1) {
                        quickSort(this.regions, 0, this.regions.length - 1);
                    }
                }
                lookupRegionByID(id) {
                    let region = null;
                    let i = 0;
                    while (i < this.regions.length && region == null) {
                        if (this.regions[i].ID == id) {
                            region = this.regions[i];
                        }
                        i++;
                    }
                    return region;
                }
                lookupSelectedRegions() {
                    let collection = Array();
                    for (var i = 0; i < this.regions.length; i++) {
                        if (this.regions[i].isSelected) {
                            collection.push(this.regions[i]);
                        }
                    }
                    return collection;
                }
                deleteRegion(region) {
                    region.removeStyles();
                    region.regionGroup.remove();
                    this.regions = this.regions.filter((r) => { return r != region; });
                    if ((typeof this.onRegionDelete) == "function") {
                        this.onRegionDelete(region.ID);
                    }
                }
                deleteSelectedRegions() {
                    let collection = this.lookupSelectedRegions();
                    for (var i = 0; i < collection.length; i++) {
                        this.deleteRegion(collection[i]);
                    }
                    this.menu.hide();
                    this.selectNextRegion();
                    this.onManipulationEnd();
                }
                deleteRegionById(id) {
                    let region = this.lookupRegionByID(id);
                    if (region != null) {
                        this.deleteRegion(region);
                    }
                    this.menu.hide();
                    this.onManipulationEnd();
                }
                deleteAllRegions() {
                    for (let i = 0; i < this.regions.length; i++) {
                        let r = this.regions[i];
                        r.removeStyles();
                        r.regionGroup.remove();
                    }
                    this.regions = [];
                    this.menu.hide();
                }
                updateTagsById(id, tagsDescriptor) {
                    let region = this.lookupRegionByID(id);
                    if (region != null) {
                        region.updateTags(tagsDescriptor);
                    }
                }
                updateTagsForSelectedRegions(tagsDescriptor) {
                    let regions = this.lookupSelectedRegions();
                    regions.forEach(region => {
                        region.updateTags(tagsDescriptor);
                    });
                }
                selectRegion(region) {
                    if (region != null) {
                        this.unselectRegions(region);
                        region.select();
                        this.menu.showOnRegion(region);
                        if ((typeof this.onRegionSelected) == "function") {
                            this.onRegionSelected(region.ID);
                        }
                    }
                }
                selectAllRegions() {
                    let r = null;
                    for (let i = 0; i < this.regions.length; i++) {
                        let r = this.regions[i];
                        r.select();
                        if ((typeof this.onRegionSelected) == "function") {
                            this.onRegionSelected(r.ID);
                        }
                    }
                    if (r != null) {
                        this.menu.showOnRegion(r);
                    }
                }
                selectRegionById(id) {
                    let region = this.lookupRegionByID(id);
                    this.selectRegion(region);
                }
                selectNextRegion() {
                    let region = null;
                    let i = 0;
                    let length = this.regions.length;
                    if (length == 1) {
                        region = this.regions[0];
                    }
                    else if (length > 1) {
                        while (i < length && region == null) {
                            if (this.regions[i].isSelected) {
                                region = (i == length - 1) ? this.regions[0] : this.regions[i + 1];
                            }
                            i++;
                        }
                    }
                    if (region == null && length > 0) {
                        region = this.regions[0];
                    }
                    this.selectRegion(region);
                }
                reshapeRegion(region, dx, dy, dw, dh, inverse = false) {
                    let w;
                    let h;
                    let x;
                    let y;
                    if (!inverse) {
                        w = region.rect.width + Math.abs(dw);
                        h = region.rect.height + Math.abs(dh);
                        x = region.x + dx + (dw > 0 ? 0 : dw);
                        y = region.y + dy + (dh > 0 ? 0 : dh);
                    }
                    else {
                        w = Math.max(0, region.rect.width - Math.abs(dw));
                        h = Math.max(0, region.rect.height - Math.abs(dh));
                        x = region.x + dx + (dw < 0 ? 0 : dw);
                        y = region.y + dy + (dh < 0 ? 0 : dh);
                    }
                    let p1 = new base.Point2D(x, y).boundToRect(this.paperRect);
                    let p2 = new base.Point2D(x + w, y + h).boundToRect(this.paperRect);
                    region.move(p1);
                    region.resize(p2.x - p1.x, p2.y - p1.y);
                }
                moveSelectedRegions(dx, dy) {
                    let regions = this.lookupSelectedRegions();
                    regions.forEach(r => {
                        this.reshapeRegion(r, dx, dy, 0, 0);
                    });
                    this.menu.showOnRegion(regions[0]);
                }
                resizeSelectedRegions(dw, dh, inverse = false) {
                    let regions = this.lookupSelectedRegions();
                    regions.forEach(r => {
                        this.reshapeRegion(r, 0, 0, dw, dh, inverse);
                    });
                    this.menu.showOnRegion(regions[0]);
                }
                resize(width, height) {
                    let tw = width / this.paperRect.width;
                    let th = height / this.paperRect.height;
                    this.paperRect.resize(width, height);
                    this.menu.hide();
                    for (var i = 0; i < this.regions.length; i++) {
                        let r = this.regions[i];
                        r.move(new base.Point2D(r.x * tw, r.y * th));
                        r.resize(r.rect.width * tw, r.rect.height * th);
                    }
                }
                onManipulationBegin_local(region) {
                    this.onManipulationBegin();
                }
                onManipulationEnd_local(region) {
                    this.onManipulationEnd();
                }
                onRegionUpdate(region, state, multiSelection) {
                    if (state == "movingbegin") {
                        if (!multiSelection) {
                            this.unselectRegions(region);
                        }
                        this.menu.hide();
                        if ((typeof this.onRegionSelected) == "function") {
                            this.onRegionSelected(region.ID);
                        }
                        this.justManipulated = false;
                    }
                    else if (state == "moving") {
                        if ((typeof this.onRegionMove) == "function") {
                            this.onRegionMove(region.ID, region.x, region.y, region.rect.width, region.rect.height);
                        }
                        this.justManipulated = true;
                    }
                    else if (state == "movingend") {
                        if (this.justManipulated) {
                            region.select();
                            this.menu.showOnRegion(region);
                            this.sortRegionsByArea();
                            this.redrawAllRegions();
                        }
                    }
                    else if (state == "clicked" && !this.justManipulated) {
                        if (!region.isSelected) {
                            if (!multiSelection) {
                                this.unselectRegions(region);
                            }
                            region.select();
                            this.menu.showOnRegion(region);
                            if ((typeof this.onRegionSelected) == "function") {
                                this.onRegionSelected(region.ID);
                            }
                        }
                        else {
                            region.unselect();
                            this.menu.hide();
                            if ((typeof this.onRegionSelected) == "function") {
                                this.onRegionSelected("");
                            }
                        }
                    }
                }
                unselectRegions(except) {
                    for (var i = 0; i < this.regions.length; i++) {
                        let r = this.regions[i];
                        if (r != except) {
                            r.unselect();
                        }
                    }
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
                    this.vl.attr({
                        x1: np.x,
                        x2: np.x,
                        y2: rect.height
                    });
                    this.hl.attr({
                        y1: np.y,
                        x2: rect.width,
                        y2: np.y
                    });
                }
                resize(width, height) {
                    this.vl.attr({
                        y2: height
                    });
                    this.hl.attr({
                        x2: width,
                    });
                }
                hide() {
                    this.crossGroup.attr({
                        visibility: 'hidden'
                    });
                }
                show() {
                    this.crossGroup.attr({
                        visibility: 'visible'
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
                    this.exclusiveCapturingState = false;
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
                    e.preventDefault();
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
                    if (e.ctrlKey && e.keyCode == 78 && !this.exclusiveCapturingState) {
                        this.enableExclusiveMode();
                        this.twoPointsMode = false;
                    }
                    if (e.keyCode == 27) {
                        this.disableExclusiveMode();
                    }
                }
                subscribeToEvents() {
                    let self = this;
                    let listeners = [
                        { event: "pointerenter", listener: this.onPointerEnter, base: this.baseParent, bypass: false },
                        { event: "pointerleave", listener: this.onPointerLeave, base: this.baseParent, bypass: false },
                        { event: "pointerdown", listener: this.onPointerDown, base: this.baseParent, bypass: false },
                        { event: "pointerup", listener: this.onPointerUp, base: this.baseParent, bypass: false },
                        { event: "pointermove", listener: this.onPointerMove, base: this.baseParent, bypass: false },
                        { event: "keydown", listener: this.onKeyDown, base: window, bypass: false },
                        { event: "keyup", listener: this.onKeyUp, base: window, bypass: true },
                    ];
                    listeners.forEach(e => {
                        e.base.addEventListener(e.event, this.enablify(e.listener.bind(this), e.bypass));
                    });
                }
                enableExclusiveMode() {
                    this.exclusiveCapturingState = true;
                    this.showAll([this.overlay]);
                    this.hideAll([this.selectionBox]);
                    this.enable();
                }
                disableExclusiveMode() {
                    this.exclusiveCapturingState = false;
                    this.hideAll([this.overlay]);
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
                    if (!this.exclusiveCapturingState) {
                        this.isEnabled = false;
                        this.areaSelectorLayer.attr({
                            display: "none"
                        });
                    }
                }
                enablify(f, bypass = false) {
                    let self = this;
                    return function (args) {
                        if (this.isEnabled || bypass) {
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