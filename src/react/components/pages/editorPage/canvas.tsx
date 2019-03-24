import React, { Fragment, ReactElement } from "react";
import * as shortid from "shortid";
import { CanvasTools } from "vott-ct";
import { RegionData } from "vott-ct/lib/js/CanvasTools/Core/RegionData";
import {
    EditorMode, IAssetMetadata,
    IProject, IRegion, RegionType, IBoundingBox, ISize,
} from "../../../../models/applicationState";
import CanvasHelpers from "./canvasHelpers";
import { AssetPreview, ContentSource } from "../../common/assetPreview/assetPreview";
import { Editor } from "vott-ct/lib/js/CanvasTools/CanvasTools.Editor";
import Clipboard from "../../../../common/clipboard";
import Confirm from "../../common/confirm/confirm";
import { strings } from "../../../../common/strings";
import { SelectionMode } from "vott-ct/lib/js/CanvasTools/Interface/ISelectorSettings";
import { Rect } from "vott-ct/lib/js/CanvasTools/Core/Rect";
import { createContentBoundingBox } from "../../../../common/layout";

export interface ICanvasProps extends React.Props<Canvas> {
    selectedAsset: IAssetMetadata;
    editorMode: EditorMode;
    selectionMode: SelectionMode;
    project: IProject;
    lockedTags: string[];
    children?: ReactElement<AssetPreview>;
    onAssetMetadataChanged?: (assetMetadata: IAssetMetadata) => void;
    onSelectedRegionsChanged?: (regions: IRegion[]) => void;
}

export interface ICanvasState {
    currentAsset: IAssetMetadata;
    contentSource: ContentSource;
    enabled: boolean;
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
        enabled: false,
    };

    private canvasZone: React.RefObject<HTMLDivElement> = React.createRef();
    private clearConfirm: React.RefObject<Confirm> = React.createRef();

    private template: Rect = new Rect(20, 20);

    public componentDidMount = () => {
        const sz = document.getElementById("editor-zone") as HTMLDivElement;
        this.editor = new CanvasTools.Editor(sz);
        this.editor.autoResize = false;
        this.editor.onSelectionEnd = this.onSelectionEnd;
        this.editor.onRegionMoveEnd = this.onRegionMoveEnd;
        this.editor.onRegionDelete = this.onRegionDelete;
        this.editor.onRegionSelected = this.onRegionSelected;
        this.editor.AS.setSelectionMode({ mode: this.props.selectionMode });

        window.addEventListener("resize", this.onWindowResize);
    }

    public componentWillUnmount() {
        window.removeEventListener("resize", this.onWindowResize);
    }

    public componentDidUpdate = async (prevProps: Readonly<ICanvasProps>, prevState: Readonly<ICanvasState>) => {
        if (this.props.selectedAsset.asset.id !== prevProps.selectedAsset.asset.id) {
            this.setState({ currentAsset: this.props.selectedAsset });
        }

        // Handle selection mode changes
        if (this.props.selectionMode !== prevProps.selectionMode) {
            const options = (this.props.selectionMode === SelectionMode.COPYRECT) ? this.template : null;
            this.editor.AS.setSelectionMode({ mode: this.props.selectionMode, template: options });
        }

        // When the project tags change re-apply tags to regions
        if (this.props.project.tags !== prevProps.project.tags) {
            this.updateCanvasToolsRegions();
        }

        // Handles when the canvas is enabled & disabled
        if (prevState.enabled !== this.state.enabled) {
            // When the canvas is ready to display
            if (this.state.enabled) {
                this.refreshCanvasToolsRegions();
                this.setContentSource(this.state.contentSource);
                this.editor.AS.setSelectionMode(this.props.selectionMode);
                this.editor.AS.enable();

                if (this.props.onSelectedRegionsChanged) {
                    this.props.onSelectedRegionsChanged(this.getSelectedRegions());
                }
            } else { // When the canvas has been disabled
                this.editor.AS.disable();
                this.clearAllRegions();
                this.editor.AS.setSelectionMode(SelectionMode.NONE);
            }
        }
    }

    public render = () => {
        const className = this.state.enabled ? "canvas-enabled" : "canvas-disabled";

        return (
            <Fragment>
                <Confirm title={strings.editorPage.canvas.removeAllRegions.title}
                    ref={this.clearConfirm as any}
                    message={strings.editorPage.canvas.removeAllRegions.confirmation}
                    confirmButtonColor="danger"
                    onConfirm={this.removeAllRegions}
                />
                <div id="ct-zone" ref={this.canvasZone} className={className} onClick={(e) => e.stopPropagation()}>
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
    }

    public copyRegions = async () => {
        await Clipboard.writeObject(this.getSelectedRegions());
    }

    public cutRegions = async () => {
        const selectedRegions = this.getSelectedRegions();
        await Clipboard.writeObject(selectedRegions);
        this.deleteRegions(selectedRegions);
    }

    public pasteRegions = async () => {
        const regionsToPaste: IRegion[] = await Clipboard.readObject();
        const asset = this.state.currentAsset;
        const duplicates = CanvasHelpers.duplicateRegionsAndMove(
            regionsToPaste,
            asset.regions,
            asset.asset.size.width,
            asset.asset.size.height,
        );
        this.addRegions(duplicates);
    }

    public confirmRemoveAllRegions = () => {
        this.clearConfirm.current.open();
    }

    public getSelectedRegions = (): IRegion[] => {
        const selectedRegions = this.editor.RM.getSelectedRegionsBounds().map((rb) => rb.id);
        return this.state.currentAsset.regions.filter((r) => selectedRegions.find((id) => r.id === id));
    }

    public updateCanvasToolsRegions = (): void => {
        for (const region of this.state.currentAsset.regions) {
            this.editor.RM.updateTagsById(
                region.id,
                CanvasHelpers.getTagsDescriptor(this.props.project.tags, region),
            );
        }
    }

    public forceResize = (): void => {
        this.onWindowResize();
    }

    private removeAllRegions = () => {
        const ids = this.state.currentAsset.regions.map((r) => r.id);
        for (const id of ids) {
            this.editor.RM.deleteRegionById(id);
        }
        this.deleteRegionsFromAsset(this.state.currentAsset.regions);
    }

    private addRegions = (regions: IRegion[]) => {
        this.addRegionsToCanvasTools(regions);
        this.addRegionsToAsset(regions);
    }

    private addRegionsToAsset = (regions: IRegion[]) => {
        this.updateAssetRegions(
            this.state.currentAsset.regions.concat(regions),
        );
    }

    public addRegionsToCanvasTools = (regions: IRegion[]) => {
        for (const region of regions) {
            const regionData = CanvasHelpers.getRegionData(region);
            const scaledRegionData = this.editor.scaleRegionToFrameSize(
                regionData,
                this.state.currentAsset.asset.size.width,
                this.state.currentAsset.asset.size.height);
            this.editor.RM.addRegion(
                region.id,
                scaledRegionData,
                CanvasHelpers.getTagsDescriptor(this.props.project.tags, region),
            );
        }
    }

    private removeAllRegions = () => {
        const ids = this.state.currentAsset.regions.map((r) => r.id);
        for (const id of ids) {
            this.editor.RM.deleteRegionById(id);
        }
        this.deleteRegionsFromAsset(this.state.currentAsset.regions);
    }

    private addRegions = (regions: IRegion[]) => {
        this.addRegionsToCanvasTools(regions);
        this.addRegionsToAsset(regions);
    }

    private deleteRegions = (regions: IRegion[]) => {
        this.deleteRegionsFromCanvasTools(regions);
        this.deleteRegionsFromAsset(regions);
    }

    private deleteRegionsFromAsset = (regions: IRegion[]) => {
        const filteredRegions = this.state.currentAsset.regions.filter((assetRegion) => {
            return !regions.find((r) => r.id === assetRegion.id);
        });
        this.updateAssetRegions(filteredRegions);
    }

    private deleteRegionsFromCanvasTools = (regions: IRegion[]) => {
        for (const region of regions) {
            this.editor.RM.deleteRegionById(region.id);
        }
    }

    /**
     * Method that gets called when a new region is drawn
     * @param {RegionData} regionData the RegionData of created region
     * @returns {void}
     */
    private onSelectionEnd = (regionData: RegionData) => {
        if (CanvasHelpers.isEmpty(regionData)) {
            return;
        }
        const id = shortid.generate();

        this.editor.RM.addRegion(id, regionData, null);

        this.template = new Rect(regionData.width, regionData.height);

        // RegionData not serializable so need to extract data
        const scaledRegionData = this.editor.scaleRegionToSourceSize(
            regionData,
            this.state.currentAsset.asset.size.width,
            this.state.currentAsset.asset.size.height,
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
        this.updateAssetRegions([...this.state.currentAsset.regions, newRegion]);
        if (this.props.onSelectedRegionsChanged) {
            this.props.onSelectedRegionsChanged([newRegion]);
        }
    }

    /**
     * Update regions within the current asset
     * @param regions
     * @param selectedRegions
     */
    private updateAssetRegions = (regions: IRegion[]) => {
        const currentAsset: IAssetMetadata = {
            ...this.state.currentAsset,
            regions,
        };
        this.setState({
            currentAsset,
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
            this.state.currentAsset.asset.size.width,
            this.state.currentAsset.asset.size.height,
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
        this.updateAssetRegions(currentRegions);
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

        this.updateAssetRegions(currentRegions);
        if (this.props.onSelectedRegionsChanged) {
            this.props.onSelectedRegionsChanged([]);
        }
    }

    /**
     * Method called when deleting a region from the editor
     * @param {string} id the id of the selected region
     * @param {boolean} multiSelect boolean whether region was selected with multi selection
     * @returns {void}
     */
    private onRegionSelected = (id: string, multiSelect: boolean) => {
        const selectedRegions = this.getSelectedRegions();
        if (this.props.onSelectedRegionsChanged) {
            this.props.onSelectedRegionsChanged(selectedRegions);
        }
        // Gets the scaled region data
        const selectedRegionsData = this.editor.RM.getSelectedRegionsBounds().find((region) => region.id === id);

        if (selectedRegionsData) {
            this.template = new Rect(selectedRegionsData.width, selectedRegionsData.height);
        }

        if (this.props.lockedTags && this.props.lockedTags.length) {
            for (const selectedRegion of selectedRegions) {
                selectedRegion.tags = CanvasHelpers.addAllIfMissing(selectedRegion.tags, this.props.lockedTags);
            }
            this.updateRegions(selectedRegions);
        }
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
     * Set the loaded asset content source into the canvas tools canvas
     */
    private setContentSource = async (contentSource: ContentSource) => {
        try {
            await this.editor.addContentSource(contentSource as any);
        } catch (e) {
            console.warn(e);
        }
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
            this.editor.resize(boundingBox.width, boundingBox.height);
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

    /**
     * Updates regions in both Canvas Tools and the asset data store
     * @param updates Regions to be updated
     * @param updatedSelectedRegions Selected regions with any changes already applied
     */
    private updateRegions = (updates: IRegion[]) => {
        const updatedRegions = CanvasHelpers.updateRegions(this.state.currentAsset.regions, updates);
        for (const update of updates) {
            this.editor.RM.updateTagsById(update.id, CanvasHelpers.getTagsDescriptor(this.props.project.tags, update));
        }
        this.updateAssetRegions(updatedRegions);
        this.updateCanvasToolsRegions();
    }

    /**
     * Updates the background of the canvas and draws the asset's regions
     */
    private clearAllRegions = () => {
        this.editor.RM.deleteAllRegions();
    }

    private refreshCanvasToolsRegions = () => {
        this.clearAllRegions();

        if (!this.state.currentAsset.regions || this.state.currentAsset.regions.length === 0) {
            return;
        }

        // Add regions to the canvas
        this.state.currentAsset.regions.forEach((region: IRegion) => {
            const loadedRegionData = CanvasHelpers.getRegionData(region);
            this.editor.RM.addRegion(
                region.id,
                this.editor.scaleRegionToFrameSize(
                    loadedRegionData,
                    this.state.currentAsset.asset.size.width,
                    this.state.currentAsset.asset.size.height,
                ),
                CanvasHelpers.getTagsDescriptor(this.props.project.tags, region));
        });
    }

    private editorModeToType = (editorMode: EditorMode) => {
        let type;
        switch (editorMode) {
            case EditorMode.CopyRect:
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
