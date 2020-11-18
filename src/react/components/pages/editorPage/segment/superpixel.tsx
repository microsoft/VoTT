import { useRef } from "react";

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
    tag: number,
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
    tag: number
    color: string
    index?: number

    constructor(tag: number, color: string, index?:number){
        this.tag = tag;
        this.color = color;
        this.index = index;
    }
}

const coloringPixel = (component: Snap.Element, color: string, opacity: number, strokeWidth: number) => {
    component.animate(
      {
        fill: color,
        opacity: opacity,
        strokeWidth: strokeWidth
      },
      0
    );
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
    keyId: number, pixels: any, canvasWidth: number, canvasHeight: number, initialAnnotation: Annotation, defaultcolor: string,
}

export const Superpixel: React.FC<SuperpixelProps> = ({ keyId, pixels, canvasWidth, canvasHeight, initialAnnotation, defaultcolor } ) => {
    const [ annotation ] = useState(new Annotation(initialAnnotation.tag, initialAnnotation.color, keyId));
    const pixelref = useRef<SVGSVGElement>(null);

    const idKey = "pixel" + keyId.toString();
    useEffect(() => {
        var s = Snap("#pixel" + keyId.toString());
        if(s.children().length <= 2){ // must be updated to check the inclusion of 'path' within children
            var pathString = getPathFromPoints(pixels, canvasWidth, canvasHeight);
            var pixel = s.path( pathString );
            pixel.attr({ stroke: "white", strokeWidth: 0, fill: annotation.color, opacity: annotation.tag < 0 ? defaultOpacity : annotatedOpacity });

            const setAndColoring = () => {
                const fillColor: string = pixelref.current.parentElement.getAttribute("color-profile")!;
                if(fillColor === 'remove'){
                    pixelref.current.setAttribute("name", String(-1));
                    pixelref.current.setAttribute("color-profile", defaultcolor);
                    coloringPixel(pixel, annotation.color, defaultOpacity, 0);
                }else{
                    pixelref.current.setAttribute("name", String(pixelref.current.parentElement.getAttribute("name")));
                    pixelref.current.setAttribute("color-profile",fillColor);
                    coloringPixel(pixel, fillColor!, annotatedOpacity, 0);
                }
            }
            pixel.mouseover( (event: MouseEvent) => {
               const annotatingTag = parseInt(pixelref.current.parentElement.getAttribute("name").toString()!);
               if(parseInt(pixelref.current.getAttribute("name")!) < 0 && annotatingTag >= 0){
                coloringPixel(pixel, pixelref.current.parentElement.getAttribute("color-profile")!, annotatingOpacity, 1);
               }
              })
              .mouseout(function (event: MouseEvent) {
               const annotatingTag = parseInt(pixelref.current.parentElement.getAttribute("name").toString()!);
               if(parseInt(pixelref.current.getAttribute("name")!) < 0 && annotatingTag >= 0){
                coloringPixel(pixel, pixelref.current.getAttribute("color-profile")!, annotation.tag >= 0 ? annotatedOpacity : defaultOpacity, 0);
               }
              })
              .mousemove(function (event: MouseEvent) {
                const annotatingTag = parseInt(pixelref.current.parentElement.getAttribute("name").toString()!);
                if(event.buttons === 1 && pixelref.current.getAttribute("name") && annotatingTag >= 0){
                    setAndColoring();
                }
              })
              .mousedown(function (event: MouseEvent) {
                const annotatingTag = parseInt(pixelref.current.parentElement.getAttribute("name").toString()!);
                if(event.buttons === 1 && pixelref.current.getAttribute("name") && annotatingTag >= 0){
                    setAndColoring();
                }
              });
        }
        // eslint-disable-next-line
    }, [canvasWidth, canvasHeight]);
    return <svg ref={pixelref} id={idKey} name={annotation.tag} colorProfile={annotation.color}/>;
  };
