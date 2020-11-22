import React, { Fragment, ReactElement } from "react";
import {
    EditorMode, IAssetMetadata,
    IBoundingBox,
    IProject,
    ISegment,
    ISegmentOffset,
} from "../../../../../models/applicationState";
import { AssetPreview, ContentSource } from "../../../common/assetPreview/assetPreview";
import Confirm from "../../../common/confirm/confirm";
import { createContentBoundingBox } from "../../../../../common/layout";
import { SegmentSelectionMode } from "../editorPage";
import { Annotation, AnnotationTag, number2SPId, Superpixel } from "./superpixel";
import { SegmentAnnotator } from "./segmentAnnotator";
import data from "./test.jpg.json";
import { ITag } from "vott-react";
import { strings } from "../../../../../common/strings";

export interface ISegmentCanvasProps extends React.Props<SegmentCanvas> {
    selectedAsset: IAssetMetadata;
    editorMode: EditorMode;
    selectionMode: SegmentSelectionMode;
    project: IProject;
    lockedTags: string[];
    children?: ReactElement<AssetPreview>;
    onAssetMetadataChanged?: (assetMetadata: IAssetMetadata) => void;
    onCanvasRendered?: (canvas: HTMLCanvasElement) => void;
}

export interface ISegmentCanvasState {
    currentAsset: IAssetMetadata;
    contentSource: ContentSource;
    enabled: boolean;
}

export default class SegmentCanvas extends React.Component<ISegmentCanvasProps, ISegmentCanvasState> {
    public static defaultProps: ISegmentCanvasProps = {
        selectionMode: SegmentSelectionMode.NONE,
        editorMode: EditorMode.None,
        selectedAsset: null,
        project: null,
        lockedTags: [],
    };

    public state: ISegmentCanvasState = {
        currentAsset: this.props.selectedAsset,
        contentSource: null,
        enabled: true,
    };

    public editor: SegmentAnnotator;

    public defaultColor = "black";

    private previousAnnotating = new Annotation( AnnotationTag.EMPTY, this.defaultColor);

    private canvasZone: React.RefObject<HTMLDivElement> = React.createRef();
    private clearConfirm: React.RefObject<Confirm> = React.createRef();

    public componentDidMount = () => {
        window.addEventListener("resize", this.onWindowResize);
        this.editor = new SegmentAnnotator({
            keyId: "mainCanvas",
            selectedAsset: this.props.selectedAsset,
            project: this.props.project,
            segmentationData: data,
            width: 1024,
            height: 768,
            defaultcolor: this.defaultColor,
            onSegmentUpdated: this.onSegmentUpdated
        });
    }

    public componentWillUnmount() {
        window.removeEventListener("resize", this.onWindowResize);
    }

    public componentDidUpdate = async (prevProps: Readonly<ISegmentCanvasProps>, prevState: Readonly<ISegmentCanvasState>) => {
        // Handles asset changing
        if (this.props.selectedAsset !== prevProps.selectedAsset) {
            this.setState({ currentAsset: this.props.selectedAsset });
        }

        // Handle selection mode changes
        if (this.props.selectionMode !== prevProps.selectionMode) {
            this.setSelectionMode(this.props.selectionMode);
        }

        // When the project tags change re-apply tags to regions
        if (this.props.project.tags !== prevProps.project.tags) {
            this.updateCanvasToolsRegionTags();
        }

        // Handles when the canvas is enabled & disabled
        if (prevState.enabled !== this.state.enabled) {
            // When the canvas is ready to display
            if (this.state.enabled) {
                this.setSelectionMode(this.props.selectionMode);
            } else { // When the canvas has been disabled
                this.setSelectionMode(SegmentSelectionMode.NONE);
            }
        }
    }

    ////////////////////////////////////////////////////////////////
    // WARNING: this should be updated
    public updateCanvasToolsRegionTags = (): void => {
        console.log("To be updated");
    }

    public setSelectionMode(segmentSelectionMode: SegmentSelectionMode){
        if(segmentSelectionMode === SegmentSelectionMode.NONE){
            this.updateAnnotating(AnnotationTag.EMPTY, this.defaultColor);
        }
        else if(segmentSelectionMode === SegmentSelectionMode.DEANNOTATING){
            this.updateAnnotating(AnnotationTag.DEANNOTATING, this.defaultColor);
        }
        else if(segmentSelectionMode === SegmentSelectionMode.ANNOTATING){
            this.updateAnnotating(this.previousAnnotating.tag, this.previousAnnotating.color);
        }
    }

    public updateAnnotating(tag: string, color: string){
        const svg = document.getElementById("mainCanvas");
        if(svg){
            svg.setAttribute("name", tag);
            svg.setAttribute("color-profile", color);
            if(tag !== AnnotationTag.EMPTY && tag !== AnnotationTag.DEANNOTATING){
                this.previousAnnotating = new Annotation(tag, color);
            }
        }
    }

    public confirmRemoveAllSegments = () => {
        this.clearConfirm.current.open();
    }

    ////////////////////////////////////////////////////////////////
    // WARNING: this should be updated
    /**
     * Toggles tag on all selected regions
     * @param selectedTag Tag name
     */
    public applyTag = (tag: ITag) => {
        this.updateAnnotating(tag.name, tag.color);
    }

    public render = () => {
        const className = this.state.enabled ? "canvas-enabled" : "canvas-disabled";
        return (
            <Fragment>
                <Confirm title={strings.editorPage.canvas.removeAllSegments.title}
                    ref={this.clearConfirm as any}
                    message={strings.editorPage.canvas.removeAllSegments.confirmation}
                    confirmButtonColor="danger"
                    onConfirm={this.removeAllSegments}
                />
                <div id="ct-zone" ref={this.canvasZone} className={className} onClick={(e) => e.stopPropagation()}>
                    <div id="selection-zone">
        <div id="editor-zone" className="full-size">
            { (this.editor && this.state.enabled) ? this.editor.render() : <></>}
        </div>
                    </div>
                </div>
                {this.renderChildren()}
            </Fragment>
        );
    }

    private removeAllSegments = () => {
        this.state.currentAsset.segments.map((s) => {
            for (const superpixel of s.superpixel){
                this.editor.deleteSegmentById(superpixel);
            }
        });
        this.deleteSegmentsFromAsset(this.state.currentAsset.segments);
    }

    private deleteSegmentsFromAsset = (segments: ISegment[]) => {
        const filteredSegments = this.state.currentAsset.segments.filter((assetSegment) => {
            return !segments.find((s) => s.id === assetSegment.id);
        });
        this.updateAssetSegments(filteredSegments);
    }

    private getInitialSegment = (id: number, tag: string, superpixelId: number, area: number, bbox: IBoundingBox): ISegment => {
        return { id: id.toString(), tag, superpixel: [superpixelId], area, boundingBox: bbox, iscrowd: 0, risk: "safe" };
    }

    private projectSegmentOffset = (segments: ISegment[], offset: ISegmentOffset, addition: boolean): ISegment[] => {
        if (addition){
            if (segments.filter((e) => e.tag === offset.tag && e.superpixel.includes(offset.superpixelId)).length > 0){ // already contains
                return segments;
            }
            let founded = 0;
            const processedSegments = segments.map((element): ISegment => {
                if (element.tag === offset.tag){
                    founded = 1;
                    return {... element, area: element.area + offset.area,
                        superpixel: [...element.superpixel, offset.superpixelId],
                        boundingBox: { left: 0, top: 0, width: 0, height: 0 },
                        iscrowd: 0,
                        risk: "safe",
                    };
                }
                else{
                    return element;
                }
            });
            return founded === 1 ? processedSegments : [...segments,
                this.getInitialSegment(segments.length, offset.tag, offset.superpixelId, offset.area, { left:0, top: 0, width:0, height: 0 })];
        }
        else{ // subtraction
            let emptyId = "";
            const processedSegments = segments.map((element): ISegment => {
                if (element.superpixel.includes(offset.superpixelId)){
                    if (element.area - offset.area === 0 || (element.superpixel.length===1 && element.superpixel.includes(offset.superpixelId))){
                        emptyId = element.id;
                    }
                    return {... element, area: element.area - offset.area,
                        superpixel: element.superpixel.filter((element) => element !== offset.superpixelId),
                        boundingBox: { left: 0, top: 0, width: 0, height: 0 },
                        iscrowd: 0,
                        risk: "safe",
                    };
                }
                else {
                    return element;
                }
            });
            return emptyId === "" ? processedSegments : segments.filter((element) => (element.id !== emptyId));
        }
    }

    private onSegmentUpdated = (segment: ISegmentOffset) => {
        const currentSegments = this.projectSegmentOffset(this.state.currentAsset.segments, segment, segment.tag !== AnnotationTag.DEANNOTATING);
        this.updateAssetSegments(currentSegments);
    }

    /**
     * Update regions within the current asset
     * @param segments
     * @param selectedRegions
     */
    private updateAssetSegments = (segments: ISegment[]) => {
        const currentAsset: IAssetMetadata = {
            ...this.state.currentAsset,
            segments,
        };
        this.setState({
            currentAsset,
        }, () => {
            this.props.onAssetMetadataChanged(currentAsset);
        });
    }

    public forceResize = (): void => {
        this.onWindowResize();
    }

    public onAnnotationUpdate = (tag: number, color: string) => {

    }

    private renderChildren = () => {
        return React.cloneElement(this.props.children, {
            onAssetChanged: this.onAssetChanged,
            onLoaded: this.onAssetLoaded,
            onError: this.onAssetError,
            onActivated: this.onAssetActivated,
            onDeactivated: this.onAssetDeactivated,
        });
    }

    /**
     * Raised when the asset bound to the asset preview has changed
     */
    private onAssetChanged = () => {
        this.setState({ enabled: false });
    }

    /**
     * Raised when the underlying asset has completed loading
     */
    private onAssetLoaded = (contentSource: ContentSource) => {
        this.setState({ contentSource });
        this.positionCanvas(contentSource);
    }

    private onAssetError = () => {
        this.setState({
            enabled: false,
        });
    }

    /**
     * Raised when the asset is taking control over the rendering
     */
    private onAssetActivated = () => {
        this.setState({ enabled: false });
    }

    /**
     * Raise when the asset is handing off control of rendering
     */
    private onAssetDeactivated = (contentSource: ContentSource) => {
        this.setState({
            contentSource,
            enabled: true,
        });
    }

    /**
     * Positions the canvas tools drawing surface to be exactly over the asset content
     */
    private positionCanvas = (contentSource: ContentSource) => {
        if (!contentSource) {
            return;
        }

        const canvas = this.canvasZone.current;
        if (canvas) {
            const boundingBox = createContentBoundingBox(contentSource);
            canvas.style.top = `${boundingBox.top}px`;
            canvas.style.left = `${boundingBox.left}px`;
            canvas.style.width = `${boundingBox.width}px`;
            canvas.style.height = `${boundingBox.height}px`;
        }
    }

    /**
     * Resizes and re-renders the canvas when the application window size changes
     */
    private onWindowResize = async () => {
        if (!this.state.contentSource) {
            return;
        }

        this.positionCanvas(this.state.contentSource);
    }


}
