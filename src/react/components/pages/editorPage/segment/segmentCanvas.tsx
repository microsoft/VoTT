import React, { Fragment, ReactElement } from "react";
import {
    EditorMode, IAssetMetadata,
    IProject,
} from "../../../../../models/applicationState";
import { AssetPreview, ContentSource } from "../../../common/assetPreview/assetPreview";
import Confirm from "../../../common/confirm/confirm";
import { Rect } from "vott-ct/lib/js/CanvasTools/Core/Rect";
import { createContentBoundingBox } from "../../../../../common/layout";
import { SegmentSelectionMode } from "../editorPage";
import { Annotation } from "./superpixel";
import { CanvasSuperpixel } from "./canvasSuperpixel";
import data from "./test.jpg.json";

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
        enabled: false,
    };

    private canvasZone: React.RefObject<HTMLDivElement> = React.createRef();

    public componentDidMount = () => {
        window.addEventListener("resize", this.onWindowResize);
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

    public setSelectionMode(segmentSelectionMode: SegmentSelectionMode){
        console.log(segmentSelectionMode);
    }

    ////////////////////////////////////////////////////////////////
    // WARNING: this should be updated
    /**
     * Toggles tag on all selected regions
     * @param selectedTag Tag name
     */
    public applyTag = (tag: string) => {
        /*
        const selectedRegions = this.getSelectedRegions();
        const lockedTags = this.props.lockedTags;
        const lockedTagsEmpty = !lockedTags || !lockedTags.length;
        const regionsEmpty = !selectedRegions || !selectedRegions.length;
        if ((!tag && lockedTagsEmpty) || regionsEmpty) {
            return;
        }
        let transformer: (tags: string[], tag: string) => string[];
        if (lockedTagsEmpty) {
            // Tag selected while region(s) selected
            transformer = CanvasHelpers.toggleTag;
        } else if (lockedTags.find((t) => t === tag)) {
            // Tag added to locked tags while region(s) selected
            transformer = CanvasHelpers.addIfMissing;
        } else {
            // Tag removed from locked tags while region(s) selected
            transformer = CanvasHelpers.removeIfContained;
        }
        for (const selectedRegion of selectedRegions) {
            selectedRegion.tags = transformer(selectedRegion.tags, tag);
        }
        this.updateRegions(selectedRegions);
        if (this.props.onSelectedRegionsChanged) {
            this.props.onSelectedRegionsChanged(selectedRegions);
        }
        */
    }

    public render = () => {
        const className = this.state.enabled ? "canvas-enabled" : "canvas-disabled";
        const annotatedList: Annotation[] = []; // [ new Annotation(1,"red", 1), new Annotation(2,"blue", 2) ];
        return (
            <Fragment>
                <div id="ct-zone" ref={this.canvasZone} className={className} onClick={(e) => e.stopPropagation()}>
                    <div id="selection-zone">
        <div id="editor-zone" className="full-size">
            {this.state.enabled? <CanvasSuperpixel keyId={"mainCanvas"} segmentationData={data} annotationData={annotatedList} width={1024} height={768} defaultcolor={"black"}/> : <></>}
        </div>
                    </div>
                </div>
                {this.renderChildren()}
            </Fragment>
        );
    }

    public forceResize = (): void => {
        this.onWindowResize();
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
