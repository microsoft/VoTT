import React, { Fragment, ReactElement } from "react";
import * as shortid from "shortid";
import { CanvasTools } from "vott-ct";
import { Editor } from "vott-ct/lib/js/CanvasTools/CanvasTools.Editor";
import { RegionData, RegionDataType } from "vott-ct/lib/js/CanvasTools/Core/RegionData";
import { TagsDescriptor } from "vott-ct/lib/js/CanvasTools/Core/TagsDescriptor";
import { Point2D } from "vott-ct/lib/js/CanvasTools/Core/Point2D";
import { Tag } from "vott-ct/lib/js/CanvasTools/Core/Tag";
import {
    IAssetMetadata, IRegion, RegionType,
    AssetState, EditorMode, IProject, AssetType,
} from "../../../../models/applicationState";
import AssetPreview, { ContentSource } from "./assetPreview";

export interface ICanvasProps extends React.Props<Canvas> {
    selectedAsset: IAssetMetadata;
    onAssetMetadataChanged: (assetMetadata: IAssetMetadata) => void;
    editorMode: EditorMode;
    project: IProject;
    children: ReactElement<AssetPreview>;
}

interface ICanvasState {
    loaded: boolean;
    contentSource: ContentSource;
    selectedRegions?: IRegion[];
    canvasEnabled: boolean;
}

export default class Canvas extends React.Component<ICanvasProps, ICanvasState> {
    public editor: Editor;

    public state: ICanvasState = {
        loaded: false,
        contentSource: null,
        selectedRegions: [],
        canvasEnabled: true,
    };

    private canvasZone: React.RefObject<HTMLDivElement> = React.createRef();

    public componentDidMount = async () => {
        const sz = document.getElementById("editor-zone") as HTMLDivElement;
        this.editor = new CanvasTools.Editor(sz);
        this.editor.onSelectionEnd = this.onSelectionEnd;
        this.editor.onRegionMove = this.onRegionMove;
        this.editor.onRegionDelete = this.onRegionDelete;
        this.editor.onRegionSelected = this.onRegionSelected;

        window.addEventListener("resize", this.onWindowResize);

        // Upload background image for selection
        await this.updateEditor();
    }

    public componentWillUnmount() {
        window.removeEventListener("resize", this.onWindowResize);
    }

    public componentDidUpdate = async (prevProps) => {
        if (this.props.selectedAsset.asset.id !== prevProps.selectedAsset.asset.id) {
            await this.updateEditor();
            if (this.props.selectedAsset.regions.length) {
                this.updateSelected([]);
            }
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

    /**
     * Method that gets called when a new region is drawn
     * @param {RegionData} commit the RegionData of created region
     * @returns {void}
     */
    public onSelectionEnd = (commit: RegionData) => {
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
        const currentAssetMetadata = this.props.selectedAsset;
        currentAssetMetadata.regions.push(newRegion);
        this.updateSelected([newRegion]);

        if (currentAssetMetadata.regions.length) {
            currentAssetMetadata.asset.state = AssetState.Tagged;
        }

        this.props.onAssetMetadataChanged(currentAssetMetadata);
    }

    /**
     * Method called when moving a region already in the editor
     * @param {string} id the id of the region that was moved
     * @param {RegionData} regionData the RegionData of moved region
     * @returns {void}
     */
    public onRegionMove = (id: string, regionData: RegionData) => {
        const currentAssetMetadata = this.props.selectedAsset;
        const movedRegionIndex = currentAssetMetadata.regions.findIndex((region) => region.id === id);
        const movedRegion = currentAssetMetadata.regions[movedRegionIndex];
        const scaledRegionData = this.editor.scaleRegionToSourceSize(regionData);

        if (movedRegion) {
            movedRegion.points = scaledRegionData.points;
        }

        currentAssetMetadata.regions[movedRegionIndex] = movedRegion;
        this.updateSelected([movedRegion]);
        this.props.onAssetMetadataChanged(currentAssetMetadata);
    }

    /**
     * Method called when deleting a region from the editor
     * @param {string} id the id of the deleted region
     * @returns {void}
     */
    public onRegionDelete = (id: string) => {
        this.editor.RM.deleteRegionById(id);
        const currentAssetMetadata = this.props.selectedAsset;
        const deletedRegionIndex = this.props.selectedAsset.regions.findIndex((region) => region.id === id);
        currentAssetMetadata.regions.splice(deletedRegionIndex, 1);

        if (!currentAssetMetadata.regions.length) {
            currentAssetMetadata.asset.state = AssetState.Visited;
        }

        this.props.onAssetMetadataChanged(currentAssetMetadata);
        this.updateSelected([]);
    }

    /**
     * Method called when deleting a region from the editor
     * @param {string} id the id of the deleted region
     * @param {boolean} multiselection boolean whether multiselect is active
     * @returns {void}
     */
    public onRegionSelected = (id: string, multiselect: boolean) => {
        let selectedRegions = this.state.selectedRegions;

        if (multiselect) {
            selectedRegions.push(
                this.props.selectedAsset.regions.find((region) => region.id === id));
        } else {
            selectedRegions = [
                this.props.selectedAsset.regions.find((region) => region.id === id)];
        }

        this.updateSelected(selectedRegions);
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
    }

    /**
     * Raised when the asset is taking control over the rendering
     */
    private onAssetActivated = (contentSource: ContentSource) => {
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
        this.setState({
            contentSource,
        });

        await this.editor.addContentSource(contentSource);
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
     * Updates the background of the canvas and draws the asset's regions
     */
    private updateEditor = async () => {
        this.editor.RM.deleteAllRegions();
    }

    private updateRegions = () => {
        if (this.props.selectedAsset.regions.length) {
            this.props.selectedAsset.regions.forEach((region: IRegion) => {
                const loadedRegionData = new RegionData(region.boundingBox.left,
                    region.boundingBox.top,
                    region.boundingBox.width,
                    region.boundingBox.height,
                    region.points.map((point) =>
                        new Point2D(point.x, point.y)),
                    this.regionTypeToType(region.type));
                if (region.tags.length) {
                    this.editor.RM.addRegion(region.id, this.editor.scaleRegionToFrameSize(loadedRegionData),
                        new TagsDescriptor(region.tags.map((tag) => new Tag(tag.name,
                            this.props.project.tags.find((t) => t.name === tag.name).color))));
                } else {
                    this.editor.RM.addRegion(region.id, this.editor.scaleRegionToFrameSize(loadedRegionData),
                        new TagsDescriptor());
                }
                if (this.state.selectedRegions) {
                    this.setState({
                        selectedRegions: [this.props.selectedAsset.regions[
                            this.props.selectedAsset.regions.length - 1]],
                    });
                }
            });
        }
    }

    private updateSelected = (selectedRegions: IRegion[]) => {
        this.setState({
            selectedRegions,
        });
    }

    private regionTypeToType = (regionType: RegionType) => {
        let type;
        switch (regionType) {
            case RegionType.Rectangle:
                type = RegionDataType.Rect;
                break;
            case RegionType.Polygon:
                type = RegionDataType.Polygon;
                break;
            case RegionType.Point:
                type = RegionDataType.Point;
                break;
            case RegionType.Polyline:
                type = RegionDataType.Polyline;
                break;
            default:
                break;
        }
        return type;
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
