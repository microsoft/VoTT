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
    children?: ReactElement<AssetPreview>;
    onAssetMetadataChanged?: (assetMetadata: IAssetMetadata) => void;
}

export interface ICanvasState {
    currentAsset: IAssetMetadata;
    contentSource: ContentSource;
    selectedRegions?: IRegion[];
    canvasEnabled: boolean;
}

export default class Canvas extends React.Component<ICanvasProps, ICanvasState> {
    public static defaultProps: ICanvasProps = {
        selectionMode: SelectionMode.NONE,
        editorMode: EditorMode.Select,
        selectedAsset: null,
        project: null,
    };

    public editor: Editor;

    public state: ICanvasState = {
        currentAsset: this.props.selectedAsset,
        contentSource: null,
        selectedRegions: [],
        canvasEnabled: true,
    };

    private canvasZone: React.RefObject<HTMLDivElement> = React.createRef();

    public componentDidMount = () => {
        const sz = document.getElementById("editor-zone") as HTMLDivElement;
        this.editor = new CanvasTools.Editor(sz);
        this.editor.onSelectionEnd = this.onSelectionEnd;
        this.editor.onRegionMoveEnd = this.onRegionMoveEnd;
        this.editor.onRegionDelete = this.onRegionDelete;
        this.editor.onRegionSelected = this.onRegionSelected;
        this.editor.AS.setSelectionMode(this.props.selectionMode, null);

        window.addEventListener("resize", this.onWindowResize);

        this.clearAllRegions();
    }

    public componentWillUnmount() {
        window.removeEventListener("resize", this.onWindowResize);
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
                <div id="ct-zone"
                    ref={this.canvasZone}
                    className={this.state.canvasEnabled ? "canvas-enabled" : "canvas-disabled"}>
                    <div id="selection-zone">
                        <div id="editor-zone" className="full-size" />
                    </div>
                </div>
                {this.renderChildren()}
            </Fragment>
        );
    }

    public applyTag = (selectedTag: string) => {
        for (const region of this.state.selectedRegions) {
            this.toggleTagOnRegion(region, selectedTag);
        }
    }

    /**
     * Method that gets called when a new region is drawn
     * @param {RegionData} commit the RegionData of created region
     * @returns {void}
     */
    private onSelectionEnd = (commit: RegionData) => {
        const id = shortid.generate();

        this.editor.RM.addRegion(id, commit, null);

        // RegionData not serializable so need to extract data
        const scaledRegionData = this.editor.scaleRegionToSourceSize(commit);
        const newRegion = {
            id,
            type: this.editorModeToType(this.props.editorMode),
            tags: [],
            boundingBox: {
                height: scaledRegionData.height,
                width: scaledRegionData.width,
                left: scaledRegionData.x,
                top: scaledRegionData.y,
            },
            points: scaledRegionData.points,
        };
        this.updateAssetRegions([
            ...this.state.currentAsset.regions,
            newRegion,
        ], [newRegion]);
    }

    private updateAssetRegions(regions: IRegion[], selectedRegions: IRegion[]) {
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
        const scaledRegionData = this.editor.scaleRegionToSourceSize(regionData);

        if (movedRegion) {
            movedRegion.points = scaledRegionData.points;
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
     * @param {boolean} multiselection boolean whether multiselect is active
     * @returns {void}
     */
    private onRegionSelected = (id: string, multiselect: boolean) => {
        const region = this.state.currentAsset.regions.find((region) => region.id === id);
        let selectedRegions = this.state.selectedRegions;
        if (multiselect) {
            selectedRegions.push(region);
        } else {
            selectedRegions = [region];
        }
        this.setState({selectedRegions});
    }

    private renderChildren = () => {
        return React.cloneElement(this.props.children, {
            onLoaded: this.onAssetLoaded,
            onActivated: this.onAssetActivated,
            onDeactivated: this.onAssetDeactivated,
        });
    }

    /**
     * Raised when the underlying asset has completed loading
     */
    private onAssetLoaded = async (contentSource: ContentSource) => {
        this.positionCanvas(contentSource);
        await this.setContentSource(contentSource);
        this.updateRegions();
    }

    /**
     * Raised when the asset is taking control over the rendering
     */
    private onAssetActivated = (contentSource: ContentSource) => {
        this.clearAllRegions();
        this.setState({
            canvasEnabled: false,
        });
    }

    /**
     * Raise when the asset is handing off control of rendering
     */
    private onAssetDeactivated = async (contentSource: ContentSource) => {
        this.positionCanvas(contentSource);
        await this.setContentSource(contentSource);
        this.updateRegions();

        this.setState({
            canvasEnabled: true,
        });
    }

    /**
     * Set the loaded asset content source into the canvas tools canvas
     */
    private setContentSource = async (contentSource: ContentSource) => {
        this.setState({ contentSource });
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
    }

    private onWindowResize = () => {
        this.positionCanvas(this.state.contentSource);
    }

    /**
     * Add tag to region if not there already, remove tag from region
     * if already contained in tags. Update tags in CanvasTools editor
     * @param region Region to add or remove tag
     * @param tag Tag to add or remove from region
     */
    private toggleTagOnRegion = (region: IRegion, tag: string) => {
        CanvasHelpers.toggleTag(region.tags, tag);
        this.editor.RM.updateTagsById(region.id, CanvasHelpers.getTagsDescriptor(this.props.project.tags, region));
        const updatedRegions = this.state.currentAsset.regions.map((r) => (r.id === region.id) ? region : r);
        const updatedSelectedRegions = this.state.currentAsset.regions.map((r) => (r.id === region.id) ? region : r);
        this.updateAssetRegions(updatedRegions, updatedSelectedRegions);
    }

    /**
     * Updates the background of the canvas and draws the asset's regions
     */
    private clearAllRegions = () => {
        this.editor.RM.deleteAllRegions();
    }

    private updateRegions = () => {
        if (!this.state.currentAsset.regions || this.state.currentAsset.regions.length === 0) {
            return;
        }

        // Add regions to the canvas
        this.state.currentAsset.regions.forEach((region: IRegion) => {
            const loadedRegionData = CanvasHelpers.getRegionData(region);
            this.editor.RM.addRegion(
                region.id,
                this.editor.scaleRegionToFrameSize(loadedRegionData),
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
