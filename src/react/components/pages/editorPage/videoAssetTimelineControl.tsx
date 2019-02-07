import React from "react";
import { IAsset, AssetType } from "../../../../models/applicationState";
import { strings } from "../../../../common/strings";

/**
 * Properties for the video timeline renderer
 * @member asset - Asset for preview
 */
interface IVideoTimelineAssetsProps {
    asset: IAsset;
}

/**
 * @name - Asset Preview
 * @description - Small preview of assets for selection in editor page
 */
export default class VideoTimelineAssets extends React.Component<IVideoTimelineAssetsProps> {

    constructor(props, context) {
        super(props, context);
    }

    public render() {
        const { asset } = this.props;
        const tagTimeLines: any = [];

        // For now, just fake the locations of the lines, but eventually these will come from the frames
        // with tags.
        for (let i = 1; i < 6; i++) {
            tagTimeLines.push(<div key={i} className="videoTimeline" style={{ left: i * 150 + "px" }} />);
        }

        return (
            <div className="videoTimelineParent">
                {tagTimeLines}
            </div>
        );
    }
}
