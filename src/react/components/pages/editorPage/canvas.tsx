import React, { Fragment } from "react";
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

export interface ICanvasProps {
    selectedAsset: IAssetMetadata;
    onAssetMetadataChanged: (assetMetadata: IAssetMetadata) => void;
    editorMode: EditorMode;
    project: IProject;
}

interface ICanvasState {
    loaded: boolean;
    selectedRegions?: IRegion[];
    canvasEnabled: boolean;
}

export default class Canvas extends React.Component<ICanvasProps, ICanvasState> {
    public editor: Editor;

    public state: ICanvasState = {
        loaded: false,
        selectedRegions: [],
        canvasEnabled: true,
    };

    public componentDidMount = async () => {
        const sz = document.getElementById("editor-zone") as HTMLDivElement;
        // this.editor = new CanvasTools.Editor(sz);
        // this.editor.onSelectionEnd = this.onSelectionEnd;
        // this.editor.onRegionMove = this.onRegionMove;
        // this.editor.onRegionDelete = this.onRegionDelete;
        // this.editor.onRegionSelected = this.onRegionSelected;

        // // Upload background image for selection
        // await this.updateEditor();
    }

    public componentDidUpdate = async (prevProps) => {
        if (this.props.selectedAsset.asset.path !== prevProps.selectedAsset.asset.path) {
            await this.updateEditor();
            if (this.props.selectedAsset.regions.length) {
                this.updateSelected([]);
            }
        }
    }

    public render = () => {
        return (
            <Fragment>
                {/* <div id="ct-zone" className={this.state.canvasEnabled ? "canvas-enabled" : "canvas-disabled"}>
                    <div id="selection-zone" className={`asset-${this.getAssetType()}`}>
                        <div id="editor-zone" className="full-size" />
                    </div>
                </div> */}
                <AssetPreview autoPlay={true}
                    asset={this.props.selectedAsset.asset}
                    onAssetLoaded={this.onAssetLoaded} />
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
        const ct = CanvasTools;
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

    private onAssetLoaded(contentSource: ContentSource) {
        // Todo set canvas tools source.
    }

    /**
     * Updates the background of the canvas and draws the asset's regions
     */
    private updateEditor = async () => {
        this.editor.RM.deleteAllRegions();
        //await this.loadAsset();
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

    private getAssetType = () => {
        switch (this.props.selectedAsset.asset.type) {
            case AssetType.Image:
                return "image";
            case AssetType.Video:
                return "video";
            default:
                return "unknown";
        }
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
