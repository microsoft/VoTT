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
    private svgHost: SVGSVGElement;
    
    constructor(props, context) {
        super(props, context);

        
        // let svgHost = document.getElementById("svgHost") as unknown as SVGSVGElement;

        this.state = {
            loaded: false,
        };

        
    }

    public componentDidMount(){
        this.svgHost = document.getElementById("svgHost") as unknown as SVGSVGElement;
        let ct = CanvasTools.CanvasTools;

        var editor = new ct.Editor(this.svgHost);
        editor.addToolbar(this.svgHost, ct.Editor.FullToolbarSet, "./images/icons/");

        var incrementalRegionID = 100;

        editor.onSelectionEnd = (commit) => {
            let r = commit.boundRect;

            let primaryTag = new ct.Base.Tags.Tag(
                        (Math.random() > 0.5) ? "Awesome" : "Brilliante!",
                        Math.floor(Math.random() * 360.0));
            let secondaryTag = new ct.Base.Tags.Tag(
                        (Math.random() > 0.5) ? "Yes" : "No",
                        Math.floor(Math.random() * 360.0));
            let ternaryTag = new ct.Base.Tags.Tag(
                        (Math.random() > 0.5) ? "one" : "two",
                        Math.floor(Math.random() * 360.0));
            let tags = new ct.Base.Tags.TagsDescriptor(primaryTag, [secondaryTag, ternaryTag]);

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
        let imageCnvs = document.getElementById("sourceImageCnvs") as HTMLCanvasElement;
        let imagePath = "./../images/background-cat.jpg";
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

            let filter = new ct.Filter.FilterPipeline();
            //filter.addFilter(ct.Filter.InvertFilter);
            //filter.addFilter(ct.Filter.GrayscaleFilter);
            filter.applyToCanvas(buffCnvs).then((bcnvs) => {
                // Copy buffer to the canvas on screen
                imageCnvs.width = bcnvs.width;
                imageCnvs.height = bcnvs.height;
                let imgContext = imageCnvs.getContext("2d");
                imgContext.drawImage(bcnvs, 0, 0, bcnvs.width, bcnvs.height);
            });
        });
        image.src = imagePath;
    }

    public render() {
        // const { loaded } = this.state;
        // const { svgHost } = this.props;

        return (<div id="ctZone" className="canvas-preview">
            <svg id="svgHost">
                <defs>
                    <filter id="black-glow">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                            <feOffset dx="0" dy="0" result="offsetblur" />
                            <feComponentTransfer>
                            <feFuncA type="linear" slope="0.8" />
                        </feComponentTransfer>
                        <feMerge>
                            <feMergeNode />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
            </svg>
        </div>
        );
    }
}
