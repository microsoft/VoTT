import React from "react";
import { IAsset, AssetType } from "../../../../models/applicationState";
import * as CanvasTools from "canvastools";

interface ICanvasProps {
    selectedAsset: IAsset;
}

interface ICanvasState {
    loaded: boolean;
}

export default class Canvas extends React.Component<ICanvasProps, ICanvasState> {
    constructor(props, context) {
        super(props, context);

        this.state = {
            loaded: false,
        };

        
    }

    public componentDidMount(){
        var ct = CanvasTools.CanvasTools;
        var sz = document.getElementById("editorzone") as unknown as HTMLDivElement;
        var tz = document.getElementById("toolbarzone")as unknown as HTMLDivElement;

        // @ts-ignore
        var editor = new ct.Editor(sz);
        editor.addToolbar(tz, ct.Editor.FullToolbarSet, "../../../images/icons/");

        var incrementalRegionID = 100;

        let primaryTag = new ct.Base.Tags.Tag(
            (Math.random() > 0.5) ? "Awesome" : "Brilliante",
            Math.floor(Math.random() * 360.0));
        let secondaryTag = new ct.Base.Tags.Tag(
            (Math.random() > 0.5) ? "Yes" : "No",
            Math.floor(Math.random() * 360.0));
        let ternaryTag = new ct.Base.Tags.Tag(
            (Math.random() > 0.5) ? "one" : "two",
            Math.floor(Math.random() * 360.0));

        editor.onSelectionEnd = (commit) => {
            let r = commit.boundRect;
            
            let tags = 
                (Math.random() < 0.3) ?        
                    new ct.Base.Tags.TagsDescriptor(primaryTag, [secondaryTag, ternaryTag]):
                ((Math.random() > 0.5) ? 
                    new ct.Base.Tags.TagsDescriptor(secondaryTag, [ternaryTag, primaryTag]):
                    new ct.Base.Tags.TagsDescriptor(ternaryTag, [primaryTag, secondaryTag]));

            if (commit.meta !== undefined && commit.meta.point !== undefined) {
                let point = commit.meta.point;
                editor.RM.addPointRegion((incrementalRegionID++).toString(), new ct.Base.Point.Point2D(point.x, point.y), tags);
            } else {
                editor.RM.addRectRegion((incrementalRegionID++).toString(), new ct.Base.Point.Point2D(r.x1, r.y1), new ct.Base.Point.Point2D(r.x2, r.y2), tags);
            }
        }
        
        editor.onRegionMove = (id, x, y, width, height) => {
            console.log(`Moved ${id}: {${x}, ${y}} x {${width}, ${height}}`);
        }

        // Upload background image for selection
        let image = new Image();
        image.addEventListener("load", (e) => {
            // Create buffer
            let buffCnvs = document.createElement("canvas");
            let context = buffCnvs.getContext("2d");
            // @ts-ignore
            buffCnvs.width = e.target.width;
            // @ts-ignore
            buffCnvs.height = e.target.height;
            // Fill buffer
            // @ts-ignore
            context.drawImage(e.target, 0, 0, buffCnvs.width, buffCnvs.height);

            editor.addContentSource(buffCnvs);
            // let filter = new ct.Filter.FilterPipeline();
            // //filter.addFilter(ct.Filter.InvertFilter);
            // //filter.addFilter(ct.Filter.GrayscaleFilter);
            // filter.applyToCanvas(buffCnvs).then((bcnvs) => {
            //     // Copy buffer to the canvas on screen
            //     imageCnvs.width = bcnvs.width;
            //     imageCnvs.height = bcnvs.height;
            //     let imgContext = imageCnvs.getContext("2d");
            //     imgContext.drawImage(bcnvs, 0, 0, bcnvs.width, bcnvs.height);
            // });
        });
        image.src = this.props.selectedAsset.path;
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
}
