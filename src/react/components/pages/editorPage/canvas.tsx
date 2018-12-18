import React from "react";
import { IAssetMetadata, IRegion, RegionType, AssetState } from "../../../../models/applicationState";
// const ct = require('vott-ct').CanvasTools
// import * as CanvasTools from "vott-ct"
import { CanvasTools } from "vott-ct"
import { Editor } from "vott-ct/lib/js/CanvasTools/CanvasTools.Editor";

interface ICanvasProps {
    selectedAsset: IAssetMetadata;
    onAssetMetadataChanged: (assetMetadata: IAssetMetadata) => void;
}

interface ICanvasState {
    loaded: boolean;
}

export default class Canvas extends React.Component<ICanvasProps, ICanvasState> {
    private editor: Editor;

    //Region Manager Methods
    public addPointRegion;
    public addPolylineRegion;
    public addRectRegion;
    public deleteAllRegions;
    public deleteRegionById;
    public drawRegion;
    public freeze;
    public getSelectedRegionsBounds;
    public redrawAllRegions;
    public resize;
    public selectRegionById;
    public toggleFreezeMode;
    public unfreeze;
    public updateTagsById;
    public updateTagsForSelectedRegions;

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
        this.drawRegion = this.editor.RM.drawRegion.bind(this.editor.RM);
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
                points: [new ct.Core.Point2D(r.x1, r.y1), new ct.Core.Point2D(r.x2, r.y2)]
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
                movedRegion.points = [new ct.Core.Point2D(x, y), new ct.Core.Point2D(x + width, y + height)]
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

    private updateEditor = () => {
        this.deleteAllRegions();
        let image = new Image();
        image.addEventListener("load", (e) => {
            console.log("loading")
            //@ts-ignore
            this.editor.addContentSource(e.target);
        });
        image.src = this.props.selectedAsset.asset.path; 
        if(this.props.selectedAsset.regions.length){
            this.props.selectedAsset.regions.forEach((region: IRegion) => {
                this.addRectRegion(region.id, region.points[0], region.points[1], region.tags);
            });
        }
        this.redrawAllRegions();
    }
}
