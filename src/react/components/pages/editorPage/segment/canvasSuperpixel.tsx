import React, { useRef, useState } from "react";
import { Annotation } from "./superpixel";
import { Superpixel } from "./superpixel";

const keys: number[] = [];

const getAnnotationData = (
    key: number,
    array: Annotation[],
    defaultAnnotating: Annotation
): Annotation => {
    for (var e of array) {
        if (e.index === key) return { tag: e.tag, color: e.color };
    }
    return defaultAnnotating;
};

interface CanvasSuperpixelProps {
    keyId: string;
    segmentationData: any;
    width: number;
    height: number;
    defaultcolor: string;
    annotationData: Annotation[];
}

export const CanvasSuperpixel: React.FC<CanvasSuperpixelProps> = ({
    keyId,
    segmentationData,
    width,
    height,
    defaultcolor,
    annotationData
}) => {
    const canvasRef = useRef<SVGSVGElement>(null);

    const onAnnotatingUpdated = (tag: number, color: string) => {
        //setAnnotating({ tag: index, color: color }); // computationally intensive requiring re-rendering
        canvasRef.current.setAttribute("name", tag.toString());
        canvasRef.current.setAttribute("color-profile", color);
    };

    const [annotating] = useState(new Annotation(-1, "white"));
    if (keys.length === 0){
      for (let k in segmentationData) keys.push(parseInt(k));
    }
    const viewBoxString = [0, 0, width, height].join(" ");
    const annotatedIndices = annotationData.map(element => element.index);
    return (
        <svg
            ref={canvasRef}
            id={keyId}
            viewBox={viewBoxString}
            name={annotating.tag.toString()}
            colorProfile={annotating.color}
        >
            {keys.map(key => {
                const initialAnnotation = annotatedIndices.includes(key)
                    ? getAnnotationData(key, annotationData, annotating)
                    : annotating;
                return (
                    <Superpixel
                        keyId={key}
                        pixels={segmentationData[String(key)].split(",")}
                        canvasWidth={width}
                        canvasHeight={height}
                        initialAnnotation={initialAnnotation}
                        defaultcolor={defaultcolor}
                        key={key}
                    />
                );
            })}
        </svg>
    );
};
