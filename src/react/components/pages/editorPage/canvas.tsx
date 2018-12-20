import React from "react";
import { IAssetMetadata, IRegion, RegionType, AssetState } from "../../../../models/applicationState";
// const ct = require('vott-ct').CanvasTools
// import * as CanvasTools from "vott-ct"
import { CanvasTools } from "vott-ct"
import { Editor } from "vott-ct/lib/js/CanvasTools/CanvasTools.Editor";
import { IPoint2D } from "vott-ct/lib/js/CanvasTools/Interface/IPoint2D";
import { TagsDescriptor } from "vott-ct/lib/js/CanvasTools/Core/CanvasTools.Tags";

interface ICanvasProps {
    selectedAsset: IAssetMetadata;
    onAssetMetadataChanged: (assetMetadata: IAssetMetadata) => void;
}

interface ICanvasState {
    loaded: boolean;
}

export default class Canvas extends React.Component<ICanvasProps, ICanvasState> {
    private editor: Editor;
    private frameWidth: number;
    private frameHeight: number;
    private ratioWidth: number;
    private ratioHeight: number;
    private sourceWidth: number;
    private sourceHeight: number;

    //Region Manager Methods
    /**
     * @name addPointRegion
     * @description adds point region to the canvas
     * @param {string} id
     * @param {IPoint2D} point
     * @param {TagsDescriptor} tagsDescriptor
     * @returns {void}
     */
    public addPointRegion: (id: string, point: IPoint2D, tagsDescriptor: TagsDescriptor) => void;

    /**
     * @name addPolylineRegion
     * @description adds polygon region to the canvas
     * @param {string} id
     * @param {IPoint2D[]} points
     * @param {TagsDescriptor} tagsDescriptor
     * @returns {void}
     */
    public addPolylineRegion: (id: string, points: IPoint2D[], tagsDescriptor: TagsDescriptor) => void;

    /**
     * @name addRectRegion
     * @description adds rectagular region to the canvas
     * @param {string} id
     * @param {IPoint2D[]} points
     * @param {TagsDescriptor} tagsDescriptor
     * @returns {void}
     */
    public addRectRegion: (id: string, pointA: IPoint2D, pointB: IPoint2D, tagsDescriptor: TagsDescriptor) => void;

    /**
     * @name deleteAllRegions
     * @description deletes all regions from the canvas
     * @returns {void}
     */
    public deleteAllRegions: () => void;

    /**
     * @name deleteRegionById
     * @description deletes region with given id from the canvas
     * @param {string} id
     * @returns {void}
     */
    public deleteRegionById: (id: string) => void;

    /**
     * @name freeze
     * @description freezes all regions the canvas to prevent accidental edits (used for hotkey control)
     * @param {string} nuance
     * @returns {void}
     */
    public freeze: (nuance: string) => void;

    /**
     * @name getSelectedRegionsBounds
     * @description get the boinding box info for the current region
     * @returns {Object}
     */
    public getSelectedRegionsBounds: () => {id: string, x: number, y: number, width: number, height: number};

    /**
     * @name redrawAllRegions
     * @description clears all regions from the canvas and redraws them
     * @returns {void}
     */
    public redrawAllRegions: () => void;

    /**
     * @name resize
     * @description resize editor canvas
     * @param {number} width
     * @param {number} height
     * @returns {void}
     */
    public resize: (width: number, height: number) => void;

    /**
     * @name selectRegionById
     * @description selects region with given id on the canvas
     * @param {string} id
     * @returns {void}
     */
    public selectRegionById: (id: string) => void;

    /**
     * @name toggleFreezeMode
     * @description toggles between freezing/unfreezing all regions on the canvas
     * @returns {void}
     */
    public toggleFreezeMode: () => void;

    /**
     * @name unfreeze
     * @description unfreezes all regions on the canvas
     * @returns {void}
     */
    public unfreeze: () => void;

    /**
     * @name updateTagsById
     * @description uppdates region with given id with provided tags descriptor
     * @param {string} id
     * @param {TagsDescriptor} tagsDescriptor
     * @returns {void}
     */
    public updateTagsById: (id: string, tagsDescriptor: TagsDescriptor) => void;

    /**
     * @name updateTagsForSelectedRegions
     * @description uppdates tags for currently selected region with provided tags descriptor
     * @param {TagsDescriptor} tagsDescriptor
     * @returns {void}
     */
    public updateTagsForSelectedRegions: (tagsDescriptor: TagsDescriptor) => void;

    constructor(props, context) {
        super(props, context);

        this.state = {
            loaded: false,
        };
    } 

    public componentDidMount(){
        const ct = CanvasTools;
        const sz = document.getElementById("editorzone") as unknown as HTMLDivElement;
        const tz = document.getElementById("toolbarzone")as unknown as HTMLDivElement;

        // @ts-ignore
        this.editor = new ct.Editor(sz);
        this.editor.addToolbar(tz, ct.Editor.FullToolbarSet, "./../../../images/icons/");

        //Expose CanvasTools RegionManager API
        this.addPointRegion = this.editor.RM.addPointRegion.bind(this.editor.RM);
        this.addPolylineRegion = this.editor.RM.addPolylineRegion.bind(this.editor.RM);
        this.addRectRegion = this.editor.RM.addRectRegion.bind(this.editor.RM);
        this.deleteAllRegions = this.editor.RM.deleteAllRegions.bind(this.editor.RM);
        this.deleteRegionById = this.editor.RM.deleteRegionById.bind(this.editor.RM);
        this.freeze = this.editor.RM.freeze.bind(this.editor.RM);
        this.getSelectedRegionsBounds = this.editor.RM.getSelectedRegionsBounds.bind(this.editor.RM);
        this.redrawAllRegions = this.editor.RM.redrawAllRegions.bind(this.editor.RM);
        this.resize = this.editor.RM.resize.bind(this.editor.RM);
        this.selectRegionById = this.editor.RM.selectRegionById.bind(this.editor.RM);
        this.toggleFreezeMode = this.editor.RM.toggleFreezeMode.bind(this.editor.RM);
        this.unfreeze = this.editor.RM.unfreeze.bind(this.editor.RM);
        this.updateTagsById = this.editor.RM.updateTagsById.bind(this.editor.RM);
        this.updateTagsForSelectedRegions = this.editor.RM.updateTagsForSelectedRegions.bind(this.editor.RM);

        let incrementalRegionID = 100;

        let primaryTag = new ct.Core.Tag(
            (Math.random() > 0.5) ? "Awesome" : "Brilliante",
            Math.floor(Math.random() * 360.0));
        let secondaryTag = new ct.Core.Tag(
            (Math.random() > 0.5) ? "Yes" : "No",
            Math.floor(Math.random() * 360.0));
        let ternaryTag = new ct.Core.Tag(
            (Math.random() > 0.5) ? "one" : "two",
            Math.floor(Math.random() * 360.0));

        this.editor.onSelectionEnd = (commit) => {
            let r = commit.boundRect;
            
            let tags = 
                (Math.random() < 0.3) ?        
                    new ct.Core.TagsDescriptor(primaryTag, [secondaryTag, ternaryTag]):
                ((Math.random() > 0.5) ? 
                    new ct.Core.TagsDescriptor(secondaryTag, [ternaryTag, primaryTag]):
                    new ct.Core.TagsDescriptor(ternaryTag, [primaryTag, secondaryTag]));

            if (commit.meta !== undefined && commit.meta.point !== undefined) {
                let point = commit.meta.point;
                this.addPointRegion((incrementalRegionID++).toString(), new ct.Core.Point2D(point.x, point.y), tags);
            } else {
                this.addRectRegion((incrementalRegionID++).toString(), new ct.Core.Point2D(r.x1, r.y1), new ct.Core.Point2D(r.x2, r.y2), tags);
            }

            let newRegion = {
                id: incrementalRegionID.toString(),
                type: RegionType.Rectangle,
                tags: tags,
                points: [new ct.Core.Point2D(r.x1 / this.ratioWidth, r.y1 / this.ratioHeight), new ct.Core.Point2D(r.x2 / this.ratioWidth, r.y2 / this.ratioHeight)]
            }

            let currentAssetMetadata = this.props.selectedAsset;
            currentAssetMetadata.regions.push(newRegion)
            if(currentAssetMetadata.regions.length){
                currentAssetMetadata.asset.state = AssetState.Tagged;
            }

            this.props.onAssetMetadataChanged(currentAssetMetadata);
        }
        
        this.editor.onRegionMove = (id, x, y, width, height) => {
            console.log(`Moved ${id}: {${x}, ${y}} x {${width}, ${height}}`);
            let currentAssetMetadata = this.props.selectedAsset;
            let movedRegionIndex = currentAssetMetadata.regions.findIndex(region => {return region.id == id})
            let movedRegion = currentAssetMetadata.regions[movedRegionIndex]
            if(movedRegion){
                movedRegion.points = [new ct.Core.Point2D(x / this.ratioWidth, y / this.ratioHeight), new ct.Core.Point2D((x + width) / this.ratioWidth, (y + height) / this.ratioHeight)]
            }
            currentAssetMetadata.regions[movedRegionIndex] = movedRegion;
            this.props.onAssetMetadataChanged(currentAssetMetadata);
        }

        this.editor.onRegionDelete = (id) => {
            this.deleteRegionById(id)
            let currentAssetMetadata = this.props.selectedAsset;
            let deletedRegionIndex = this.props.selectedAsset.regions.findIndex(region => {return region.id == id})
            currentAssetMetadata.regions.splice(deletedRegionIndex,1);
            if(!currentAssetMetadata.regions.length){
                currentAssetMetadata.asset.state = AssetState.Visited;
            }
            this.props.onAssetMetadataChanged(currentAssetMetadata);
        };

        // Upload background image for selection
        this.updateEditor();
    }

    public componentDidUpdate(prevProps){
        if(this.props.selectedAsset.asset.path !== prevProps.selectedAsset.asset.path){
            this.updateEditor();
        }
    }

    public render() {
        // const { loaded } = this.state;
        // const { svgHost } = this.props;

        return (
            <div id="ctZone">
                <div id="selectionzone">
                    <div id="editorzone"></div>
                </div>
                <div id="toolbarzone">
                </div>
            </div>
        );
    }

    /**
     * @name updateEditor
     * @description updates the background of the canvas and draws the asset's regions
     * @returns {void}
     */
    private updateEditor = () => {
        this.deleteAllRegions();
        let image = new Image();
        image.addEventListener("load", (e) => {
            const sz = document.getElementById("editorzone") as unknown as HTMLDivElement;
            this.frameWidth = sz.querySelector("svg").clientWidth
            this.frameHeight = sz.querySelector("svg").clientHeight
            //@ts-ignore
            this.sourceWidth = e.currentTarget.width
            //@ts-ignore
            this.sourceHeight = e.currentTarget.height
            //@ts-ignore
            this.ratioWidth = this.frameWidth/this.sourceWidth;
            //@ts-ignore
            this.ratioHeight = this.frameHeight/this.sourceHeight;


            console.log("loading")
            //@ts-ignore
            this.editor.addContentSource(e.target);
            if(this.props.selectedAsset.regions.length){
                this.props.selectedAsset.regions.forEach((region: IRegion) => {
                    let rescaledPoint1 = new CanvasTools.Core.Point2D(region.points[0].x * this.ratioWidth, region.points[0].y * this.ratioHeight)
                    let rescaledPoint2 = new CanvasTools.Core.Point2D(region.points[1].x * this.ratioWidth, region.points[1].y * this.ratioHeight)
                    this.addRectRegion(region.id, rescaledPoint1, rescaledPoint2, region.tags);
                });
            }
        });
        image.src = this.props.selectedAsset.asset.path; 
    }
}
