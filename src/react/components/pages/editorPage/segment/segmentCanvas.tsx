import React, { Fragment, ReactElement } from "react";
import {
    EditorMode, IAssetMetadata,
    IProject,
    ISegment,
} from "../../../../../models/applicationState";
import { AssetPreview, ContentSource } from "../../../common/assetPreview/assetPreview";
import Confirm from "../../../common/confirm/confirm";
import { createContentBoundingBox } from "../../../../../common/layout";
import { SegmentSelectionMode } from "../editorPage";
import { Annotation, AnnotationTag } from "./superpixel";
import { SegmentAnnotator } from "./segmentAnnotator";
import data from "./test.jpg.json";
import { ITag } from "vott-react";

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

    public componentDidMount = () => {
        window.addEventListener("resize", this.onWindowResize);
        this.editor = new SegmentAnnotator({
            keyId: "mainCanvas",
            selectedAsset: this.props.selectedAsset,
            segmentationData: data,
            width: 1024,
            height: 768,
            defaultcolor: this.defaultColor,
            annotationData: [],
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
        console.log("test");
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
        const annotatedList: Annotation[] = []; // [ new Annotation(1,"red", 1), new Annotation(2,"blue", 2) ];
        return (
            <Fragment>
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



    private onSegmentUpdated = (segment: ISegment) => {
        // addition
        if (segment.tag !== AnnotationTag.DEANNOTATING){
            const duplicated = this.state.currentAsset.segments.filter((element) => (element.id === segment.id));
            const currentSegments = 
                duplicated.length === 0 ? [...this.state.currentAsset.segments, segment] : 
                this.state.currentAsset.segments.map((element): ISegment => {
                    return { 
                        id: element.id, 
                        tag: (element.id === segment.id ? segment.tag : element.tag),
                        area: segment.area ? segment.area : 0,
                        superpixel: [],
                        boundingBox: segment.boundingBox ? segment.boundingBox : { left: 0, top: 0, width: 0, height: 0 },
                        iscrowd: 0,
                        risk: "safe",
                    };
                });
            this.updateAssetSegments(currentSegments);
        }
        else {
            this.updateAssetSegments(this.state.currentAsset.segments.filter((element) => (element.id !== segment.id)));
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
