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
        this.editor.addToolbar(tz, ct.Editor.FullToolbarSet, "../../../images/icons/");

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

        if(this.props.selectedAsset.regions.length){
            //draw the regions
        }

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
            let movedRegionIndex = this.props.selectedAsset.regions.findIndex(region => {return region.id == id})
            let movedRegion = this.props.selectedAsset.regions[movedRegionIndex]
            if(movedRegion){
                movedRegion.points = [new ct.Core.Point2D(x, y), new ct.Core.Point2D(x + width, y + height)]
            }
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
    }

    //Region Manager Methods
    public addPointRegion = this.editor.RM.addPointRegion;
    public addPolylineRegion = this.editor.RM.addPolylineRegion;
    public addRectRegion = this.editor.RM.addRectRegion;
    public deleteAllRegions = this.editor.RM.deleteAllRegions;
    public deleteRegionById = this.editor.RM.deleteRegionById;
    public drawRegion = this.editor.RM.drawRegion;
    public freeze = this.editor.RM.freeze;
    public getSelectedRegionsBounds = this.editor.RM.getSelectedRegionsBounds;
    public redrawAllRegions = this.editor.RM.redrawAllRegions;
    public resize = this.editor.RM.resize;
    public selectRegionById = this.editor.RM.selectRegionById;
    public toggleFreezeMode = this.editor.RM.toggleFreezeMode;
    public unfreeze = this.editor.RM.unfreeze;
    public updateTagsById = this.editor.RM.updateTagsById;
    public updateTagsForSelectedRegions = this.editor.RM.updateTagsForSelectedRegions;

}
