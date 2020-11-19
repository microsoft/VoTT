import React from "react";
import { IAssetMetadata, ISegment } from "../../../../../models/applicationState";
import { Annotation, AnnotationTag } from "./superpixel";
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

export interface ISegmentAnnotatorProps {
    selectedAsset: IAssetMetadata;
    keyId: string;
    segmentationData: any;
    width: number;
    height: number;
    defaultcolor: string;
    annotationData: Annotation[];
    onSegmentUpdated?: (segment: ISegment) => void;
}

export interface ISegmentAnnotatorState {
    currentAsset: IAssetMetadata;
    annotating: Annotation;
    enabled: boolean;
}

export class SegmentAnnotator extends React.Component<
    ISegmentAnnotatorProps,
    ISegmentAnnotatorState
> {
    public static defaultProps: ISegmentAnnotatorProps = {
        keyId: "mainCanvas",
        selectedAsset: null,
        segmentationData: undefined,
        width: 0,
        height: 0,
        defaultcolor: "black",
        annotationData: [],
    };

    public state: ISegmentAnnotatorState = {
        currentAsset: this.props.selectedAsset,
        annotating: new Annotation(AnnotationTag.EMPTY, this.props.defaultcolor),
        enabled: true
    };

    public componentDidMount = () => {
        this.canvasRef = React.createRef<SVGSVGElement>();
    };

    public componentWillUnmount = () => {
        
    }

    public render = () => {
        const className = this.state.enabled
            ? "canvas-enabled"
            : "canvas-disabled";
        const viewBoxString = [0, 0, this.props.width, this.props.height].join(
            " "
        );
        const annotatedIndices = this.props.annotationData.map(
            element => element.index
        );
        if (keys.length === 0) {
            for (let k in this.props.segmentationData) keys.push(parseInt(k));
        }
        return (
            <svg
                ref={this.canvasRef}
                id={this.props.keyId}
                viewBox={viewBoxString}
                name={this.state.annotating.tag}
                colorProfile={this.state.annotating.color}
            >
                {keys.map(key => {
                    const initialAnnotation = annotatedIndices.includes(key)
                        ? getAnnotationData(
                              key,
                              this.props.annotationData,
                              this.state.annotating
                          )
                        : this.state.annotating;
                    return (
                        <Superpixel
                            keyId={key}
                            pixels={this.props.segmentationData[
                                String(key)
                            ].split(",")}
                            canvasWidth={this.props.width}
                            canvasHeight={this.props.height}
                            initialAnnotation={initialAnnotation}
                            defaultcolor={this.props.defaultcolor}
                            key={key}
                            onSegmentUpdated={this.props.onSegmentUpdated}
                        />
                    );
                })}
            </svg>
        );
    };

    private onAnnotatingUpdated = (tag: string, color: string) => {
        //setAnnotating({ tag: index, color: color }); // computationally intensive requiring re-rendering
        this.canvasRef.current.setAttribute("name", tag);
        this.canvasRef.current.setAttribute("color-profile", color);
    };

    private canvasRef: React.RefObject<SVGSVGElement>;
}
