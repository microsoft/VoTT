import { useRef } from "react";
import Tag from "reactstrap/lib/Tag";
import { ISegment, ISegmentOffset } from "../../../../../models/applicationState";

export enum AnnotationTag{
    EMPTY = "empty",
    DEANNOTATING = "deannotating"
} 

const React = require("react");
const { useState, useEffect } = require("react");
const Snap = require("snapsvg-cjs");

const defaultOpacity = 0.1;
const annotatedOpacity = 0.7;
const annotatingOpacity = 0.9;

export interface IPoint{
    x: number,
    y: number,
}

export interface IAnnotation{
    tag: string,
    color: string,
    index?: number,
}

export interface ICoordinates{
    gridWidth: number, 
    gridHeight: number, 
    canvasWidth: number, 
    canvasHeight: number,
}

export class Annotation implements IAnnotation {
    tag: string
    color: string
    index?: number

    constructor(tag: string, color: string, index?:number){
        this.tag = tag;
        this.color = color;
        this.index = index;
    }
}

export const number2SPId = (id: number): string => {
    return "sp" + id.toString();
}

export const SPId2number = (spId: string): number => {
    return spId.startsWith("sp") ? parseInt(spId.substr(2)) : -1;
}

const containsAll = (arr1, arr2) => 
                arr2.every(arr2Item => arr1.includes(arr2Item))

const sameMembers = (arr1, arr2) => 
                        containsAll(arr1, arr2) && containsAll(arr2, arr1);

const defaultAnnotation = (id: number) => new Annotation(AnnotationTag.EMPTY, AnnotationTag.EMPTY, id);

interface SuperpixelProps {
    id: string, canvasWidth: number, canvasHeight: number, segmentationData: any, annotatedData: Annotation[], defaultcolor: string, annotating: Annotation, onSegmentUpdated: (...params: any[]) => void;
}

export const SuperpixelEditor: React.FC<SuperpixelProps> = ({id, canvasWidth, canvasHeight, segmentationData, annotatedData, defaultcolor, annotating, onSegmentUpdated}) => {
    const [ segmentation, setSegmentation] = useState(segmentationData);
    const [ annotated, setAnnotated] = useState(annotatedData);
    const canvasRef = useRef<SVGSVGElement>(null);
    if(segmentationData && segmentationData!==segmentation){
        setSegmentation(segmentationData);
    }
    useEffect(() => {
        var s = Snap("#" + id);
        if (s.selectAll("path").length > 0){
            s.clear();
        }
        // create superpixels
        const keys: number[] = [];
        if (keys.length === 0) {
            for (let k in segmentationData) keys.push(parseInt(k));
        }
        keys.map(key => {
            const annotation = annotatedData ? getAnnotationData(
                key,
                annotatedData,
                defaultAnnotation(key),
            ) : defaultAnnotation(key);
            const pixels = segmentationData[String(key)].split(",");
            const superpixel = s.path(
                getPathFromPoints(
                    pixels,
                    canvasWidth,
                    canvasHeight));
            superpixel.attr({ id: number2SPId(key), key, stroke: "white", strokeWidth: 0,
            fill: annotation.color === AnnotationTag.EMPTY ? defaultcolor : annotation.color,
            opacity: annotation.tag === AnnotationTag.EMPTY ? defaultOpacity : annotatedOpacity,
            tag: annotation.tag,
            name: annotation.color,
            area: pixels.length });
            superpixel.mouseover( () => {
                const annotatingTag = canvasRef.current.getAttribute("color-profile");
                const currentColor = superpixel.attr().name;
                const fillColor = canvasRef.current.getAttribute("name")!;
                if( annotatingTag !== AnnotationTag.EMPTY ){
                    canvasRef.current.setAttribute("content-script-type", currentColor); // storing color
                     updateSuperpixelSVG(superpixel,
                         annotatingTag === AnnotationTag.DEANNOTATING ? defaultcolor : fillColor,
                         annotatingOpacity,
                         1);
                }
               })
               .mouseout( () => {
                const annotatingTag = canvasRef.current.getAttribute("color-profile");
                const currentColor = superpixel.attr().name;
                if(annotatingTag !== AnnotationTag.EMPTY){
                    const backupColor = canvasRef.current.getAttribute("content-script-type");
                    updateSuperpixelSVG(superpixel,
                         backupColor,
                         currentColor === AnnotationTag.EMPTY ? defaultOpacity : annotatedOpacity,
                         0);
                }
               })
               .mousemove( (event: MouseEvent) => {
                 paintAndUpdateState(event, superpixel, defaultcolor, onSegmentUpdated);
               })
               .mousedown( (event: MouseEvent) => {
                 paintAndUpdateState(event, superpixel, defaultcolor, onSegmentUpdated);
               });
            return superpixel;
        });
    }, [segmentation, annotated]);
    const viewBoxString = [0, 0, canvasWidth, canvasHeight].join(
        " "
    );
    return (<svg key="mainCanvas" ref={canvasRef} id="mainCanvas" colorProfile={annotating.tag} name={annotating.color} viewBox={viewBoxString}></svg>);
}

const getAnnotationData = (
    key: number,
    annotatedData: Annotation[],
    defaultAnnotating: Annotation
): Annotation => {
    for (const e of annotatedData) {
        if (e.index === key) return e;
    }
    return defaultAnnotating;
};

function getPathFromPoints(points: any, canvasWidth: number, canvasHeight :number){
    const gridWidth = canvasWidth + 1;
    const gridHeight = canvasHeight + 1;
    if(points===undefined || points.length===0)
        return undefined;
    var currentPoint= convertImg2Grid(parseInt(points[0]), canvasWidth, gridWidth);
    const startPoint = currentPoint;
    var pathString = "M "+convert2Point(currentPoint, gridWidth).join(" ")+" ";
    var traverseDirection = Direction.RIGHT;
    var count = 0;
    var coordinates = {gridWidth: gridWidth, gridHeight: gridHeight, canvasWidth: canvasWidth, canvasHeight: canvasHeight};
    do{       
        if (traverseDirection === Direction.RIGHT && checkMembership(points, addOffset(currentPoint, [0, -1], gridWidth), coordinates)){
            traverseDirection = (traverseDirection + 3 ) % 4;
            [ pathString, currentPoint ] = stepForward(currentPoint, traverseDirection, pathString, gridWidth);
        } else if (traverseDirection === Direction.RIGHT && checkMembership(points, currentPoint, coordinates)){
            [ pathString, currentPoint ] = stepForward(currentPoint, Direction.RIGHT, pathString, gridWidth);
        } else if (traverseDirection === Direction.DOWN && checkMembership(points, currentPoint, coordinates)){
            traverseDirection = (traverseDirection + 3 ) % 4;
            [ pathString, currentPoint ] = stepForward(currentPoint, traverseDirection, pathString, gridWidth);
        } else if (traverseDirection === Direction.DOWN && checkMembership(points, addOffset(currentPoint, [-1, 0], gridWidth), coordinates)){ 
            [ pathString, currentPoint ] = stepForward(currentPoint, Direction.DOWN, pathString, gridWidth);
        } else if (traverseDirection === Direction.LEFT && checkMembership(points, addOffset(currentPoint, [-1, 0], gridWidth), coordinates)){ 
            traverseDirection = (traverseDirection + 3 ) % 4;
            [ pathString, currentPoint ] = stepForward(currentPoint, traverseDirection, pathString, gridWidth);
        } else if (traverseDirection === Direction.LEFT && checkMembership(points, addOffset(currentPoint, [-1, -1], gridWidth), coordinates)){ 
            [ pathString, currentPoint ] = stepForward(currentPoint, Direction.LEFT, pathString, gridWidth);
        } else if (traverseDirection === Direction.UP && checkMembership(points, addOffset(currentPoint, [-1, -1], gridWidth), coordinates)){ 
            traverseDirection = (traverseDirection + 3 ) % 4;
            [ pathString, currentPoint ] = stepForward(currentPoint, traverseDirection, pathString, gridWidth);
        } else if (traverseDirection === Direction.UP && checkMembership(points, addOffset(currentPoint, [0, -1], gridWidth), coordinates)){ 
            [ pathString, currentPoint ] = stepForward(currentPoint, Direction.UP, pathString, gridWidth);
        } else {
            traverseDirection = (traverseDirection + 1 ) % 4;
        }
        count += 1;
    } while(currentPoint !== startPoint && count < 1000);
    return pathString + "Z";
}


const Direction = {
    UP: 0,
    RIGHT: 1,
    DOWN: 2,
    LEFT: 3
}

const addOffset = (point: number, offset: number[], gridWidth: number): number => {
    return point + offset[0] + (offset[1] * gridWidth);
}

const convertGrid2Img = (index: number, gridWidth: number, canvasWidth: number): number => {
    return index % gridWidth + Math.floor(index / gridWidth) * canvasWidth;
}

const convertImg2Grid = (index: number, canvasWidth: number, gridWidth: number): number => {
    return index % canvasWidth + Math.floor(index / canvasWidth) * gridWidth;
}

function moveAlongDirection(point: number, direction: number, gridWidth: number){
    switch (direction){
        case Direction.UP:
            return addOffset(point, [0, -1], gridWidth);
        case Direction.DOWN:
            return addOffset(point, [0, 1], gridWidth);
        case Direction.LEFT:
            return addOffset(point, [-1, 0], gridWidth);
        case Direction.RIGHT:
            return addOffset(point, [1, 0], gridWidth);
        default:
            return point;
    }
}

function checkMembership(points: string[], gridPoint: number, coordinates: ICoordinates){
    if(gridPoint < 0 || gridPoint % coordinates.gridWidth >= coordinates.canvasWidth || Math.floor(gridPoint / coordinates.gridWidth) >= coordinates.canvasHeight) // exclude grid edges
        return false;
    else
        return points.includes(String(convertGrid2Img(gridPoint, coordinates.gridWidth, coordinates.canvasWidth)));
}

function convert2Point(index: number, gridWidth: number){
    return [ index%gridWidth, Math.floor(index/gridWidth) ];
}

const stepForward = (currentPoint: number, direction: number, pathString: string, gridWidth: number): [ string, number ] => {
    let newPoint = moveAlongDirection(currentPoint, direction, gridWidth);
    let newPathString = pathString + "L "+ convert2Point(newPoint, gridWidth).join(" ")+" ";
    return [ newPathString,  newPoint ];
}

const updateSuperpixelSVG = (component: Snap.Element, fill: string, opacity: number, strokeWidth: number, tag?: string, color?: string ) => {
    if (tag && color){
        component.attr({...component.attr, fill, opacity, strokeWidth, tag, name: color,});
    }
    else{
        component.attr({...component.attr, fill, opacity, strokeWidth, });
    }    
}

const paintAndUpdateState = (event, superpixel, defaultcolor, onSegmentUpdated) => {
    const annotatingTag = superpixel.parent().attr()["color-profile"];
    if(event.buttons === 2 && annotatingTag !== AnnotationTag.EMPTY){
        const fillColor: string = superpixel.parent().attr()["name"];
        paintSuperpixel(superpixel, annotatingTag, fillColor, parseInt(superpixel.attr()["area"]), onSegmentUpdated);
        superpixel.parent().attr({...superpixel.parent().attr(), "content-script-type": fillColor}); // storing color
    }
    else if(event.buttons === 1){ // removing
        deleteSuperpixelAnnotation(superpixel, defaultcolor, parseInt(superpixel.attr()["area"]), onSegmentUpdated); // area should be updated
        superpixel.parent().attr({...superpixel.parent().attr(), "content-script-type": defaultcolor}); // storing color
    }
    /*
    if(event.buttons === 1 && superpixelDOM.getAttribute("tag") && annotatingTag !== AnnotationTag.EMPTY){
        const annotatingTag: string = canvasDOM.getAttribute("tag")!;
        const fillColor: string = canvasDOM.getAttribute("name")!;
        paintSuperpixel(idKey, superpixel, annotatingTag, fillColor, onSegmentUpdated);
        canvasDOM.setAttribute("content-script-type", fillColor); // storing color
    }
    else if(event.buttons === 2 && superpixelDOM.getAttribute("tag")){ // removing
        deleteSuperpixelAnnotation(idKey, superpixel, defaultcolor, onSegmentUpdated); // area should be updated
        canvasDOM.setAttribute("content-script-type", defaultcolor); // storing color
    }*/
};

type ISegmentStateCallback = (segment: ISegmentOffset) => void;

export const paintSuperpixel =
        (snapElement: Snap.Paper, tag: string, color: string, area: number, onSegmentUpdated: ISegmentStateCallback) => {
    if (tag === AnnotationTag.EMPTY || color === AnnotationTag.EMPTY) {
        return ;
    }
    if (snapElement){
        const coloringTag = tag === AnnotationTag.DEANNOTATING ? AnnotationTag.EMPTY : tag;
        updateSuperpixelSVG(snapElement, color, coloringTag === AnnotationTag.EMPTY ? defaultOpacity : annotatedOpacity, 0, coloringTag, tag === AnnotationTag.DEANNOTATING ? AnnotationTag.EMPTY : color);
        onSegmentUpdated({tag, area, superpixelId: SPId2number(snapElement.attr("id")) });
    }
    else{
        console.log("ERROR: a superpixel was not able to find!");
    }
}

export const deleteSuperpixelAnnotation = (snapElement: Snap.Paper, defaultcolor: string, area: number, onSegmentUpdated: ISegmentStateCallback) => {
    paintSuperpixel(snapElement, AnnotationTag.DEANNOTATING, defaultcolor, area, onSegmentUpdated);
}
