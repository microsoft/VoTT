import React from "react";
import { IAsset, AssetType } from "../../../../models/applicationState";
import * as ct from "../../../../../node_modules/canvastools/src/canvastools/ts/CanvasTools";

interface ICanvasProps {
    asset: IAsset;
}

interface ICanvasState {
    loaded: boolean;
}

export default class Canvas extends React.Component<ICanvasProps, ICanvasState> {
    constructor(props, context) {
        super(props, context);

        
        let svgHost = document.getElementById("svgHost") as unknown as SVGSVGElement;

        this.state = {
            loaded: false,
        };

        var regionId = 100;

        let rm = new ct.CanvasTools.Region.RegionsManager(svgHost, () => { }, () => { });

        let selector = new ct.CanvasTools.Selection.AreaSelector(svgHost,{
            onSelectionBegin: () => {
                // no arguments, just notification
            },
            onSelectionEnd: ({boundRect:{x1, y1, x2, y2}}) => {
                // console.log("Selection: " + x1 + ": " + y1 + "; " + x2 + ": " + y2);
                // build new tag (titles + color hue value)
                var primaryTag = new ct.CanvasTools.Base.Tags.Tag(
                    (Math.random() > 0.5) ? "Awesome" : "Brilliante!",
                    Math.floor(Math.random() * 360.0));
                var secondaryTag = new ct.CanvasTools.Base.Tags.Tag(
                    (Math.random() > 0.5) ? "Yes" : "No",
                    Math.floor(Math.random() * 360.0));
                var ternaryTag = new ct.CanvasTools.Base.Tags.Tag(
                    (Math.random() > 0.5) ? "one" : "two",
                    Math.floor(Math.random() * 360.0));
                var tags = new ct.CanvasTools.Base.Tags.TagsDescriptor(primaryTag, [secondaryTag, ternaryTag]);
                // create region using regionsmanager
                rm.addRectRegion((regionId++).toString(), new ct.CanvasTools.Base.Point.Point2D(x1, y1 ), new ct.CanvasTools.Base.Point.Point2D( x2, y2 ), tags);
            }});

            rm.onManipulationEnd = function () {
                selector.enable();
            };
            rm.onManipulationBegin = function () {
                selector.disable();
            };

        this.onAssetLoad = this.onAssetLoad.bind(this);
    }

    public render() {
        const { loaded } = this.state;
        const { asset } = this.props;

        return (
            <div className="canvas-preview">
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

    private onAssetLoad() {
        this.setState({
            loaded: true,
        });
    }
}
