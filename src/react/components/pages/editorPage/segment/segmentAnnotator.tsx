import React from "react";
import { IAssetMetadata, IProject, ISegment, ISegmentOffset } from "../../../../../models/applicationState";
import { Annotation, AnnotationTag, SPId2number } from "./superpixel";
import { Superpixel } from "./superpixel";

const keys: number[] = [];

const getAnnotationData = (
    key: number,
    array: Annotation[],
    defaultAnnotating: Annotation
): Annotation => {
    for (const e of array) {
        if (e.index === key) return e;
    }
    return defaultAnnotating;
};

export interface ISegmentAnnotatorProps {
    selectedAsset: IAssetMetadata;
    keyId: string;
    segmentationData: any;
    annotatedData: Annotation[];
    width: number;
    height: number;
    defaultcolor: string;
    project: IProject;
    onSegmentUpdated?: (segment: ISegmentOffset) => void;
}

export interface ISegmentAnnotatorState {
    currentAsset: IAssetMetadata;
    annotatedData: Annotation[];
    segmentationData: any;
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
        annotatedData: null,
        segmentationData: null,
        width: 0,
        height: 0,
        project: null,
        defaultcolor: "black",
    };

    

    public state: ISegmentAnnotatorState = {
        currentAsset: this.props.selectedAsset,
        annotatedData: this.props.annotatedData,
        segmentationData: this.props.segmentationData,
        annotating: new Annotation(AnnotationTag.EMPTY, this.props.defaultcolor),
        enabled: true
    };

    public updateSegmentationData(newData: any){
        this.state = {...this.state, segmentationData: newData };
    }

    public updateAnnotatedData(newData: Annotation[]){
        this.state = {...this.state, annotatedData: newData };
    }

    public updateByNewAsset(segData: any, annData: Annotation[]){
        this.state = {...this.state, segmentationData: segData, annotatedData: annData };
    }

    public componentDidMount = () => {
        this.canvasRef = React.createRef<SVGSVGElement>();
    };

    public render = () => {
        const className = this.state.enabled
            ? "canvas-enabled"
            : "canvas-disabled";
        const viewBoxString = [0, 0, this.props.width, this.props.height].join(
            " "
        );
        const annotatedIndices = this.state.annotatedData.map(
            element => element.index
        );
        if (keys.length === 0) {
            for (let k in this.state.segmentationData) keys.push(parseInt(k));
        }
        return (
            <svg
                ref={this.canvasRef}
                id={this.props.keyId}
                viewBox={viewBoxString}
                name={this.state.annotating.tag}
                colorProfile={this.state.annotating.color}
                contentScriptType={this.props.defaultcolor} // for color backup
            >
                {keys.map(key => {
                    const initialAnnotation = annotatedIndices.includes(key)
                        ? getAnnotationData(
                              key,
                              this.state.annotatedData,
                              this.state.annotating,
                          )
                        : new Annotation(AnnotationTag.EMPTY, AnnotationTag.EMPTY, SPId2number(this.props.keyId));
                    return (
                        <Superpixel
                            keyId={key}
                            pixels={this.state.segmentationData[
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

    

    private canvasRef: React.RefObject<SVGSVGElement>;
}
