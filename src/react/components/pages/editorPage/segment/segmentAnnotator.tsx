import React from "react";
import { IAssetMetadata, IProject, ISegment, ISegmentOffset } from "../../../../../models/applicationState";
import { Annotation, AnnotationTag, number2SPId, SPId2number } from "./superpixel";
import { Superpixel, deleteSuperpixelAnnotation } from "./superpixel";

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
    width: number;
    height: number;
    defaultcolor: string;
    project: IProject;
    onSegmentUpdated?: (segment: ISegmentOffset) => void;
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
        project: null,
        defaultcolor: "black",
    };

    public state: ISegmentAnnotatorState = {
        currentAsset: this.props.selectedAsset,
        annotating: new Annotation(AnnotationTag.EMPTY, this.props.defaultcolor),
        enabled: true
    };

    public componentDidMount = () => {
        this.canvasRef = React.createRef<SVGSVGElement>();
    };

    public deleteSegmentById = (id: number) => {
        const spid = number2SPId(id);
        const area = parseInt(document.getElementById(spid).getAttribute("current-scale"));
        deleteSuperpixelAnnotation(spid, this.props.defaultcolor, area, this.props.onSegmentUpdated);
    }

    public render = () => {
        const className = this.state.enabled
            ? "canvas-enabled"
            : "canvas-disabled";
        const viewBoxString = [0, 0, this.props.width, this.props.height].join(
            " "
        );
        const givenAnnotatedData = this.decomposeSegment(this.state.currentAsset.segments);
        const annotatedIndices = givenAnnotatedData.map(
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
                contentScriptType={this.props.defaultcolor} // for color backup
            >
                {keys.map(key => {
                    const initialAnnotation = annotatedIndices.includes(key)
                        ? getAnnotationData(
                              key,
                              givenAnnotatedData,
                              this.state.annotating,
                          )
                        : new Annotation(AnnotationTag.EMPTY, AnnotationTag.EMPTY, SPId2number(this.props.keyId));
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

    private decomposeSegment = (segments: ISegment[]): Annotation[] => {
        const annotation = [];
        for (const s of segments){
            for (const superpixel of s.superpixel){
                const tag = this.props.project.tags.filter((tag) => tag.name === s.tag);
                if(tag.length > 0){
                    annotation.push(new Annotation(s.tag, tag[0].color, superpixel));
                }
            }
        }
        return annotation;
    }

    private canvasRef: React.RefObject<SVGSVGElement>;
}
