import React, { Fragment, ReactElement } from "react";
import * as shortid from "shortid";
import { CanvasTools } from "vott-ct";
import { RegionData } from "vott-ct/lib/js/CanvasTools/Core/RegionData";
import {
    AssetState, EditorMode, IAssetMetadata,
    IProject, IRegion, ITag, RegionType,
} from "../../../../models/applicationState";
import CanvasHelpers from "./canvasHelpers";
import { AssetPreview, ContentSource } from "../../common/assetPreview/assetPreview";
import { SelectionMode } from "vott-ct/lib/js/CanvasTools/Selection/AreaSelector";
import { Editor } from "vott-ct/lib/js/CanvasTools/CanvasTools.Editor";

export interface ICanvasProps extends React.Props<Canvas> {
    selectedAsset: IAssetMetadata;
    editorMode: EditorMode;
    selectionMode: SelectionMode;
    project: IProject;
    lockedTags: string[];
    children?: ReactElement<AssetPreview>;
    onAssetMetadataChanged?: (assetMetadata: IAssetMetadata) => void;
}

export interface ICanvasState {
    currentAsset: IAssetMetadata;
    contentSource: ContentSource;
    selectedRegions?: IRegion[];
}

export default class Canvas extends React.Component<ICanvasProps, ICanvasState> {

    public static defaultProps: ICanvasProps = {
        selectionMode: SelectionMode.NONE,
        editorMode: EditorMode.Select,
        selectedAsset: null,
        project: null,
        lockedTags: [],
    };

    public editor: Editor;

    public state: ICanvasState = {
        currentAsset: this.props.selectedAsset,
        contentSource: null,
        selectedRegions: [],
    };

    private intervalTimer: number = null;
    private canvasZone: React.RefObject<HTMLDivElement> = React.createRef();

    public componentDidMount = () => {
        const sz = document.getElementById("editor-zone") as HTMLDivElement;
        this.editor = new CanvasTools.Editor(sz);
        this.editor.autoResize = false;
        this.editor.onSelectionEnd = this.onSelectionEnd;
        this.editor.onRegionMoveEnd = this.onRegionMoveEnd;
        this.editor.onRegionDelete = this.onRegionDelete;
        this.editor.onRegionSelected = this.onRegionSelected;
        this.editor.AS.setSelectionMode(this.props.selectionMode, null);

        window.addEventListener("resize", this.onWindowResize);
    }

    public componentWillUnmount() {
        window.removeEventListener("resize", this.onWindowResize);
        if (this.intervalTimer) {
            clearInterval(this.intervalTimer);
        }
    }

    public componentDidUpdate = (prevProps: Readonly<ICanvasProps>) => {
        if (this.props.selectedAsset.asset.id !== prevProps.selectedAsset.asset.id) {
            this.clearAllRegions();
            this.setState({
                currentAsset: this.props.selectedAsset,
                selectedRegions: [],
            });
        }

        if (this.props.selectionMode !== prevProps.selectionMode) {
            this.editor.AS.setSelectionMode(this.props.selectionMode, null);
        }
    }

    public render = () => {
        return (
            <Fragment>
                <div id="ct-zone" ref={this.canvasZone} className="canvas-enabled">
                    <div id="selection-zone">
                        <div id="editor-zone" className="full-size" />
                    </div>
                </div>
                {this.renderChildren()}
            </Fragment>
        );
    }

    /**
     * Toggles tag on all selected regions
     * @param selectedTag Tag name
     */
    public applyTag = (tag: string) => {
        const regions = this.state.selectedRegions;
        const lockedTags = this.props.lockedTags;
        const lockedTagsEmpty = !lockedTags || !lockedTags.length;
        const regionsEmpty = !regions || !regions.length;
        if ((!tag && lockedTagsEmpty) || regionsEmpty) {
            return;
        }
        let transformer: (tags: string[], tag: string) => void;
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
        for (const region of regions) {
            transformer(region.tags, tag);
        }
        this.updateRegions(regions, regions);
    }

    /**
     * Method that gets called when a new region is drawn
     * @param {RegionData} regionData the RegionData of created region
     * @returns {void}
     */
    private onSelectionEnd = (regionData: RegionData) => {
        const id = shortid.generate();

        this.editor.RM.addRegion(id, regionData, null);

        // RegionData not serializable so need to extract data
        const scaledRegionData = this.editor.scaleRegionToSourceSize(
            regionData,
            this.props.selectedAsset.asset.size.width,
            this.props.selectedAsset.asset.size.height,
        );
        const lockedTags = this.props.lockedTags;
        const newRegion = {
            id,
            type: this.editorModeToType(this.props.editorMode),
            tags: lockedTags || [],
            boundingBox: {
                height: scaledRegionData.height,
                width: scaledRegionData.width,
                left: scaledRegionData.x,
                top: scaledRegionData.y,
            },
            points: scaledRegionData.points,
        };
        if (lockedTags && lockedTags.length) {
            this.editor.RM.updateTagsById(id, CanvasHelpers.getTagsDescriptor(this.props.project.tags, newRegion));
        }
        this.updateAssetRegions([
            ...this.state.currentAsset.regions,
            newRegion,
        ], [newRegion]);
    }

    /**
     * Update regions within the current asset
     * @param regions
     * @param selectedRegions
     */
    private updateAssetRegions = (regions: IRegion[], selectedRegions: IRegion[]) => {
        const currentAsset: IAssetMetadata = {
            ...this.state.currentAsset,
            regions,
        };
        this.setState({
            currentAsset,
            selectedRegions,
        }, () => {
            this.props.onAssetMetadataChanged(currentAsset);
        });
    }

    /**
     * Method called when moving a region already in the editor
     * @param {string} id the id of the region that was moved
     * @param {RegionData} regionData the RegionData of moved region
     * @returns {void}
     */
    private onRegionMoveEnd = (id: string, regionData: RegionData) => {
        const currentRegions = this.state.currentAsset.regions;
        const movedRegionIndex = currentRegions.findIndex((region) => region.id === id);
        const movedRegion = currentRegions[movedRegionIndex];
        const scaledRegionData = this.editor.scaleRegionToSourceSize(
            regionData,
            this.props.selectedAsset.asset.size.width,
            this.props.selectedAsset.asset.size.height,
        );

        if (movedRegion) {
            movedRegion.points = scaledRegionData.points;
            movedRegion.boundingBox = {
                height: scaledRegionData.height,
                width: scaledRegionData.width,
                left: scaledRegionData.x,
                top: scaledRegionData.y,
            };
        }

        currentRegions[movedRegionIndex] = movedRegion;
        this.updateAssetRegions(currentRegions, [movedRegion]);
    }

    /**
     * Method called when deleting a region from the editor
     * @param {string} id the id of the deleted region
     * @returns {void}
     */
    private onRegionDelete = (id: string) => {
        // Remove from Canvas Tools
        this.editor.RM.deleteRegionById(id);

        // Remove from project
        const currentRegions = this.state.currentAsset.regions;
        const deletedRegionIndex = currentRegions.findIndex((region) => region.id === id);
        currentRegions.splice(deletedRegionIndex, 1);

        this.updateAssetRegions(currentRegions, []);
    }

    /**
     * Method called when deleting a region from the editor
     * @param {string} id the id of the deleted region
     * @param {boolean} multiselect boolean whether region was selected with multiselection
     * @returns {void}
     */
    private onRegionSelected = (id: string, multiselect: boolean) => {
        if (!id) {
            this.setState({
                selectedRegions: [],
            });
            return;
        }
        const region = this.state.currentAsset.regions.find((r) => r.id === id);
        if (!region) {
            throw new Error(`Couldn't find region with id ${id}`);
        }
        let selectedRegions = this.state.selectedRegions;
        if (multiselect) {
            CanvasHelpers.toggleRegion(selectedRegions, region);
        } else {
            selectedRegions = [region];
        }
        if (this.props.lockedTags && this.props.lockedTags.length) {
            for (const selectedRegion of selectedRegions) {
                CanvasHelpers.addAllIfMissing(selectedRegion.tags, this.props.lockedTags);
            }
            this.updateRegions(selectedRegions, selectedRegions);
        } else {
            this.setState({selectedRegions});
        }
    }

    private renderChildren = () => {
        return React.cloneElement(this.props.children, {
            onLoaded: this.onAssetLoaded,
            onActivated: this.onAssetActivated,
            onDeactivated: this.onAssetDeactivated,
        });
    }

    /**
     * Syncs the canvas with the content source
     */
    private syncContentSource = () => {
        // Don't start a new interval if one is already started
        if (this.intervalTimer) {
            return;
        }

        // Setup an interval for ever 33ms...
        // This is roughly equivalent to 30fps on videos
        this.intervalTimer = window.setInterval(async () => {
            this.positionCanvas(this.state.contentSource);
            await this.setContentSource(this.state.contentSource);
        }, 33);
    }

    /**
     * Stops auto sync of the canvas with the underlying content source
     */
    private stopContentSource = () => {
        // If an sync interval exists then clear it
        if (this.intervalTimer) {
            window.clearInterval(this.intervalTimer);
            this.intervalTimer = null;
        }
    }

    /**
     * Raised when the underlying asset has completed loading
     */
    private onAssetLoaded = (contentSource: ContentSource) => {
        this.setState({ contentSource }, async () => {
            this.positionCanvas(this.state.contentSource);
            await this.setContentSource(this.state.contentSource);
            this.updateCanvasToolsRegions();
        });
    }

    /**
     * Raised when the asset is taking control over the rendering
     */
    private onAssetActivated = () => {
        this.clearAllRegions();
        this.editor.AS.setSelectionMode(SelectionMode.NONE);
        this.syncContentSource();
    }

    /**
     * Raise when the asset is handing off control of rendering
     */
    private onAssetDeactivated = () => {
        if (this.intervalTimer) {
            this.stopContentSource();
        } else {
            this.setContentSource(this.state.contentSource);
        }

        this.updateCanvasToolsRegions();
        this.editor.AS.setSelectionMode(this.props.selectionMode);
    }

    /**
     * Set the loaded asset content source into the canvas tools canvas
     */
    private setContentSource = async (contentSource: ContentSource) => {
        try {
            await this.editor.addContentSource(contentSource);
        } catch (e) {
            console.warn(e);
        }
    }

    /**
     * Positions the canvas tools drawing surface to be exactly over the asset content
     */
    private positionCanvas = (contentSource: ContentSource) => {
        const canvas = this.canvasZone.current;
        canvas.style.top = `${contentSource.offsetTop}px`;
        canvas.style.left = `${contentSource.offsetLeft}px`;
        canvas.style.width = `${contentSource.offsetWidth}px`;
        canvas.style.height = `${contentSource.offsetHeight}px`;
        this.editor.resize(contentSource.offsetWidth, contentSource.offsetHeight);
    }

    /**
     * Resizes and re-renders the canvas when the application window size changes
     */
    private onWindowResize = () => {
        this.positionCanvas(this.state.contentSource);
        if (!this.intervalTimer) {
            this.setContentSource(this.state.contentSource);
        }
    }

    /**
     * Updates regions in both Canvas Tools and the asset data store
     * @param updates Regions to be updated
     * @param updatedSelectedRegions Selected regions with any changes already applied
     */
    private updateRegions = (updates: IRegion[], updatedSelectedRegions: IRegion[]) => {
        const updatedRegions = CanvasHelpers.updateRegions(this.state.currentAsset.regions, updates);
        for (const update of updates) {
            this.editor.RM.updateTagsById(update.id, CanvasHelpers.getTagsDescriptor(this.props.project.tags, update));
        }
        this.updateAssetRegions(updatedRegions, updatedSelectedRegions);
    }

    /**
     * Updates the background of the canvas and draws the asset's regions
     */
    private clearAllRegions = () => {
        this.editor.RM.deleteAllRegions();
    }

    private updateCanvasToolsRegions = () => {
        if (!this.state.currentAsset.regions || this.state.currentAsset.regions.length === 0) {
            return;
        }

        this.clearAllRegions();

        // Add regions to the canvas
        this.state.currentAsset.regions.forEach((region: IRegion) => {
            const loadedRegionData = CanvasHelpers.getRegionData(region);
            this.editor.RM.addRegion(
                region.id,
                this.editor.scaleRegionToFrameSize(
                    loadedRegionData,
                    this.props.selectedAsset.asset.size.width,
                    this.props.selectedAsset.asset.size.height,
                ),
                CanvasHelpers.getTagsDescriptor(this.props.project.tags, region));
        });

        // Set selected region to the last region
        this.setState({
            selectedRegions: [this.state.currentAsset.regions[this.state.currentAsset.regions.length - 1]],
        });
    }

    private updateSelected = (selectedRegions: IRegion[]) => {
        this.setState({
            selectedRegions,
        });
    }

    private editorModeToType = (editorMode: EditorMode) => {
        let type;
        switch (editorMode) {
            case EditorMode.Rectangle:
                type = RegionType.Rectangle;
                break;
            case EditorMode.Polygon:
                type = RegionType.Polygon;
                break;
            case EditorMode.Point:
                type = RegionType.Point;
                break;
            case EditorMode.Polyline:
                type = RegionType.Polyline;
                break;
            default:
                break;
        }
        return type;
    }
}
