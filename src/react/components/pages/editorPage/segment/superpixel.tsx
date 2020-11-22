import { useRef } from "react";
import { ISegmentOffset } from "../../../../../models/applicationState";

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

type ISegmentStateCallback = (segment: ISegmentOffset) => void;

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

const updateSuperpixelSVG = (component: Snap.Element, fill: string, opacity: number, strokeWidth: number) => {
       component.attr({
        fill,
        opacity,
        strokeWidth,
    });
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

interface SuperpixelProps {
    keyId: number, pixels: any, canvasWidth: number, canvasHeight: number, initialAnnotation: Annotation, defaultcolor: string, onSegmentUpdated: (...params: any[]) => void;
}

const updateSuperpixelHTML = (component: HTMLElement, tag: string, color: string) => {
    component.setAttribute("name", tag);
    component.setAttribute("color-profile", color);
}

export const paintSuperpixel =
        (id: string, tag: string, color: string, area: number, onSegmentUpdated: ISegmentStateCallback) => {
    if (tag === AnnotationTag.EMPTY || color === AnnotationTag.EMPTY) {
        return ;
    }
    const component = document.getElementById(id);
    const superpixel = Snap("#" + id);
    if (component && superpixel){
        const coloringTag = tag === AnnotationTag.DEANNOTATING ? AnnotationTag.EMPTY : tag;
        updateSuperpixelHTML(component, coloringTag, tag === AnnotationTag.DEANNOTATING ? AnnotationTag.EMPTY : color);
        updateSuperpixelSVG(superpixel.select('path'), color, coloringTag === AnnotationTag.EMPTY ? defaultOpacity : annotatedOpacity, 0);
        onSegmentUpdated({tag, area, superpixelId: SPId2number(id) });
    }
    else{
        console.log("ERROR: " + id + " was not able to find!");
    }
}

export const deleteSuperpixelAnnotation = (id: string, defaultcolor: string, area: number, onSegmentUpdated: ISegmentStateCallback) => {
    paintSuperpixel(id, AnnotationTag.DEANNOTATING, defaultcolor, area, onSegmentUpdated);
}

export const number2SPId = (id: number): string => {
    return "sp" + id.toString();
}

export const SPId2number = (spId: string): number => {
    return spId.startsWith("sp") ? parseInt(spId.substr(2)) : -1;
}

export const Superpixel: React.FC<SuperpixelProps> = ({ keyId, pixels, canvasWidth, canvasHeight, initialAnnotation, defaultcolor, onSegmentUpdated } ) => {
    const [ annotation ] = useState(new Annotation(initialAnnotation.tag, initialAnnotation.color, keyId));
    const [ area ] = useState(pixels.length);
    const pixelref = useRef<SVGSVGElement>(null);
    const idKey = number2SPId(keyId);
    useEffect(() => {
        var s = Snap("#" + number2SPId(keyId));
        if(s.children().length <= 2){ // must be updated to check the inclusion of 'path' within children
            var pathString = getPathFromPoints(pixels, canvasWidth, canvasHeight);
            var superpixel = s.path( pathString );
            superpixel.attr({ stroke: "white", strokeWidth: 0, fill: annotation.color, opacity: annotation.tag === AnnotationTag.EMPTY ? defaultOpacity : annotatedOpacity });
            pixelref.current.setAttribute("current-scale", area);
            const paintAndUpdateState = (event, onSegmentUpdated) => {
                const annotatingTag = pixelref.current.parentElement.getAttribute("name");
                if(event.buttons === 1 && pixelref.current.getAttribute("name") && annotatingTag !== AnnotationTag.EMPTY){
                    const annotatingTag: string = pixelref.current.parentElement.getAttribute("name")!;
                    const fillColor: string = pixelref.current.parentElement.getAttribute("color-profile")!;
                    paintSuperpixel(idKey, annotatingTag, fillColor, area, onSegmentUpdated);
                    pixelref.current.parentElement.setAttribute("content-script-type", fillColor); // storing color
                }
                else if(event.buttons === 2 && pixelref.current.getAttribute("name")){ // removing
                    deleteSuperpixelAnnotation(idKey, defaultcolor, area, onSegmentUpdated); // area should be updated
                    pixelref.current.parentElement.setAttribute("content-script-type", defaultcolor); // storing color
                }
            };
            superpixel.mouseover( () => {
               const annotatingTag = pixelref.current.parentElement.getAttribute("name");
               const currentColor = pixelref.current.getAttribute("color-profile");
               const fillColor = pixelref.current.parentElement.getAttribute("color-profile")!;
               if( annotatingTag !== AnnotationTag.EMPTY ){
                    pixelref.current.parentElement.setAttribute("content-script-type", currentColor); // storing color
                    updateSuperpixelSVG(superpixel,
                        annotatingTag === AnnotationTag.DEANNOTATING ? defaultcolor : fillColor,
                        annotatingOpacity,
                        1);
               }
              })
              .mouseout( () => {
               const annotatingTag = pixelref.current.parentElement.getAttribute("name");
               const currentColor = pixelref.current.getAttribute("color-profile");
               if(annotatingTag !== AnnotationTag.EMPTY){
                   const backupColor = pixelref.current.parentElement.getAttribute("content-script-type");
                   updateSuperpixelSVG(superpixel,
                        backupColor,
                        currentColor === AnnotationTag.EMPTY ? defaultOpacity : annotatedOpacity,
                        0);
               }
              })
              .mousemove( (event: MouseEvent) => {
                paintAndUpdateState(event, onSegmentUpdated);
              })
              .mousedown( (event: MouseEvent) => {
                paintAndUpdateState(event, onSegmentUpdated);
              });
        }
        // eslint-disable-next-line
    }, [canvasWidth, canvasHeight]);
    return <svg ref={pixelref} id={idKey} name={annotation.tag} colorProfile={annotation.color}/>;
  };
