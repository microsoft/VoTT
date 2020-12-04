import React, { Fragment, ReactElement } from "react";
import {
    EditorMode, IAssetMetadata,
    IBoundingBox,
    IProject,
    ISegment,
    ISegmentOffset,
} from "../../../../../models/applicationState";
import * as shortid from "shortid";
import { AssetPreview, ContentSource } from "../../../common/assetPreview/assetPreview";
import Confirm from "../../../common/confirm/confirm";
import { createContentBoundingBox } from "../../../../../common/layout";
import { SegmentSelectionMode } from "../editorPage";
import { Annotation, AnnotationTag, clearEditor, getBoundingBox } from "./superpixelEditor";
import { ITag } from "vott-react";
import { strings } from "../../../../../common/strings";
import { SuperpixelEditor } from "./superpixelEditor";

export interface ISegmentCanvasProps extends React.Props<SegmentCanvas> {
    selectedAsset: IAssetMetadata;
    selectionMode: SegmentSelectionMode;
    project: IProject;
    lockedTag: string;
    children?: ReactElement<AssetPreview>;
    onAssetMetadataChanged?: (assetMetadata: IAssetMetadata) => void;
    onSelectedSegmentChanged?: (segment: ISegment) => void;
    onCanvasRendered?: (canvas: HTMLCanvasElement) => void;
}

const superpixelEditorId = "superpixel-editor-main-canvas";

export interface ISegmentCanvasState {
    currentAsset: IAssetMetadata;
    contentSource: ContentSource;
    enabled: boolean;
    annotatedData: Annotation[];
    segmentationData: any; // json object
    lastSelectedTag: string;
}

export default class SegmentCanvas extends React.Component<ISegmentCanvasProps, ISegmentCanvasState> {
    public static defaultProps: ISegmentCanvasProps = {
        selectionMode: SegmentSelectionMode.NONE,
        selectedAsset: null,
        project: null,
        lockedTag: undefined,
    };

    public state: ISegmentCanvasState = {
        currentAsset: this.props.selectedAsset,
        contentSource: null,
        enabled: true,
        annotatedData: null,
        segmentationData: null,
        lastSelectedTag: AnnotationTag.EMPTY,
    };

    public defaultColor = "black";

    private currentAnnotating = new Annotation( AnnotationTag.EMPTY, this.defaultColor);
    private previousAnnotating = new Annotation( AnnotationTag.EMPTY, this.defaultColor);

    private canvasZone: React.RefObject<HTMLDivElement> = React.createRef();
    private clearConfirm: React.RefObject<Confirm> = React.createRef();

    public componentDidMount = () => {
        window.addEventListener("resize", this.onWindowResize);
    }

    public componentWillUnmount() {
        window.removeEventListener("resize", this.onWindowResize);
    }

    public componentDidUpdate = async (prevProps: Readonly<ISegmentCanvasProps>, prevState: Readonly<ISegmentCanvasState>) => {

        // Handles asset changing
        if(this.props.selectedAsset.segmentationData && this.state.segmentationData === null){
            this.setState({ currentAsset: this.props.selectedAsset, annotatedData: this.decomposeSegment(this.props.selectedAsset.segments), segmentationData: await this.loadSegmentationData(this.props.selectedAsset.segmentationData.path)});
        }
        else if (this.props.selectedAsset !== prevProps.selectedAsset) {
            this.setState({ currentAsset: this.props.selectedAsset, annotatedData: this.decomposeSegment(this.props.selectedAsset.segments), segmentationData: await this.loadSegmentationData(this.props.selectedAsset.segmentationData.path) });
        }

        // Handle selection mode changes
        if (this.props.selectionMode !== prevProps.selectionMode) {
            this.setSelectionMode(this.props.selectionMode);
        }

        const assetIdChanged = this.state.currentAsset.asset.id !== prevState.currentAsset.asset.id;

        // When the selected asset has changed but is still the same asset id
        if (!assetIdChanged && this.state.currentAsset !== prevState.currentAsset) {
            this.refreshCanvasToolsSegments();
        }


        // When the project tags change re-apply tags to segments
        if (this.props.project.tags !== prevProps.project.tags) {
            this.updateCanvasToolsSegmentTags();
        }

        // Handles when the canvas is enabled & disabled
        if (prevState.enabled !== this.state.enabled) {
            // When the canvas is ready to display
            if (this.state.enabled) {
                //this.refreshCanvasToolsSegments();
                //this.clearSegmentationData();
                this.setSelectionMode(this.props.selectionMode);

                if (this.props.onSelectedSegmentChanged) {
                    this.props.onSelectedSegmentChanged(this.getSelectedSegment(this.state.lastSelectedTag));
                }
            } else { // When the canvas has been disabled
                this.setSelectionMode(SegmentSelectionMode.NONE);
            }
        }
    }

    ////////////////////////////////////////////////////////////////
    // WARNING: this should be updated
    public updateCanvasToolsSegmentTags = (): void => {
        console.log("To be updated");
        for (const segment of this.state.currentAsset.segments) {
            /*
            this.editor.updateTagsById(
                segment.id,
                CanvasHelpers.getTagsDescriptor(this.props.project.tags, region),
            );
            */
        }
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
        const svg = document.getElementById(superpixelEditorId);
        if(svg){
            svg.setAttribute("color-profile", tag);
            svg.setAttribute("name", color);
            if(tag !== AnnotationTag.EMPTY && tag !== AnnotationTag.DEANNOTATING){
                this.previousAnnotating = new Annotation(tag, color);
            }
        }
    }

    public getSelectedSegment = (tag: string): ISegment => {
        if (tag){
            const selectedSegments = this.state.currentAsset.segments.filter( (s) => s.tag === tag );
            if (selectedSegments && selectedSegments.length) {
                return selectedSegments[0];
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
            { this.state.segmentationData ? 
            <SuperpixelEditor id={superpixelEditorId}
                canvasWidth={1024} canvasHeight={768}
                segmentationData={this.state.segmentationData}
                annotatedData={this.decomposeSegment(this.state.currentAsset.segments)}
                defaultcolor={this.defaultColor} annotating={this.currentAnnotating}
                onSegmentsUpdated={this.onSegmentsUpdated}
                onSelectedTagUpdated={this.onSelectedTagUpdated} />
            : <div> segmentation is loading... </div> }
            
        </div>
                    </div>
                </div>
                {this.renderChildren()}
            </Fragment>
        );
    }

    private onSelectedTagUpdated = async (
        tag: string,
    ): Promise<void> => {
        if (tag) {
            const selectedSegment = this.getSelectedSegment(tag);
            if (this.props.onSelectedSegmentChanged && this.state.lastSelectedTag !== tag) {
                this.props.onSelectedSegmentChanged(selectedSegment);
            }
            this.setState( {... this.state, lastSelectedTag: tag} );
        }
    }

    private clearSegmentationData(){
        this.setState( {... this.state, segmentationData: null});
    }

    private async loadSegmentationData(path: string){
        const response = await fetch(path
                ,{
                headers : { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
                }
                )
        return await response.json();
    }

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

    private removeAllSegments = (removeState: boolean = true) => {
        clearEditor(superpixelEditorId, this.defaultColor);
        if (removeState) {
            this.deleteSegmentsFromAsset(this.state.currentAsset.segments);
        }
    }

    private deleteSegmentsFromAsset = (segments: ISegment[]) => {
        const filteredSegments = this.state.currentAsset.segments.filter((assetSegment) => {
            return !segments.find((s) => s.id === assetSegment.id);
        });
        this.updateAssetSegments(filteredSegments);
    }

    private refreshCanvasToolsSegments = () => {
        //forceEditorUpdate();
        /*
        // the function currently not used
        if (!this.state.currentAsset.segments || this.state.currentAsset.segments.length === 0) {
            return;
        }
        //this.removeAllSegments(false);
        */
       //this.setState({... this.state, annotatedData: this.decomposeSegment(this.state.currentAsset.segments), });
    }

    private getInitialSegment = (id: number, tag: string, superpixelId: number, area: number, bbox: IBoundingBox): ISegment => {
        return { id: id.toString(), tag, superpixel: [superpixelId], area, boundingBox: bbox, iscrowd: 0, risk: "safe" };
    }

    private integrateOffset(segment: ISegment, offset: ISegmentOffset, toBeAdded: boolean = true){
        if (!toBeAdded && segment.area - offset.area <= 0){
            return undefined;
        }
        const newSuperpixel = toBeAdded ? [...segment.superpixel, offset.superpixelId]
        : segment.superpixel.filter((element) => element !== offset.superpixelId);
        return {... segment, area: toBeAdded ? segment.area + offset.area : segment.area - offset.area,
            superpixel: newSuperpixel,
            boundingBox: getBoundingBox(superpixelEditorId, newSuperpixel),
        };
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
                    return this.integrateOffset(element, offset, addition);
                }
                else {
                    return element;
                }
            });
            return founded === 1 ? processedSegments : [...segments,
                this.getInitialSegment(shortid.generate(), offset.tag, offset.superpixelId, offset.area, { left:0, top: 0, width:0, height: 0 })];
        }
        else{ // subtraction
            let emptyId = "";
            const processedSegments = segments.map((element): ISegment => {
                if (element.superpixel.includes(offset.superpixelId)){
                    if (element.area - offset.area === 0 || (element.superpixel.length===1 && element.superpixel.includes(offset.superpixelId))){
                        emptyId = element.id;
                    }
                    return this.integrateOffset(element, offset, addition);
                }
                else {
                    return element;
                }
            });
            return emptyId === "" ? processedSegments : segments.filter((element) => (element.id !== emptyId));
        }
    }

    private onSegmentsUpdated = (segments: ISegmentOffset[]) => {
        for (const segment of segments){
            const currentSegments = this.projectSegmentOffset(this.state.currentAsset.segments, segment, segment.tag !== AnnotationTag.DEANNOTATING);
            this.updateAssetSegments(currentSegments);
        }
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
