import React, { ReactElement } from "react";
import { ControlBar, ProgressControl } from "video-react";
import { IAsset, AssetType, AssetState } from "../../../../models/applicationState";
import { strings } from "../../../../common/strings";
import { react } from "babel-types";

/**
 * Properties for the video timeline renderer
 * @member asset - Asset for preview
 */
interface IVideoTimelineAssetsProps {
    childAssets: IAsset[];
    videoDuration: number;
    controlBar: React.RefObject<ControlBar>;
}

interface IVideoTimelineAssetState {
    progressHolder: ProgressControl;
}

/**
 * @name - Asset Preview
 * @description - Small preview of assets for selection in editor page
 */
export default class VideoTimelineAssets extends React.Component<IVideoTimelineAssetsProps> {

    public state: IVideoTimelineAssetState = {
        progressHolder: null,
    };

    constructor(props, context) {
        super(props, context);
    }

    public componentDidUpdate(prevProps: Readonly<IVideoTimelineAssetsProps>) {
        // Find the control progress bar holder in the control bar
        if (this.state.progressHolder === null || this.props.controlBar.current !== prevProps.controlBar.current) {
            if (this.props.controlBar && this.props.controlBar.current) {
                for (const controlBarChild of this.props.controlBar.current.getFullChildren()) {
                    if (controlBarChild.key === "progress-control") {
                        this.setState({
                            progressHolder: controlBarChild,
                        });
                    }
                }
            }
        }
    }

    public render() {
        const { childAssets } = this.props;
        const tagTimeLines: any = [];

        // Add some markers for frames that have been visited with yellow and tagged with green
        for (const childAsset of childAssets) {
            // Calcualte the left position
            const childPosition: number = (childAsset.timestamp / this.props.videoDuration);
            tagTimeLines.push(<div key={childAsset.timestamp} className="videoTimeline"
                style={{
                    left: (childPosition * 100) + "%",
                    border: childAsset.state === AssetState.Tagged ? "1px solid green" : "1px solid yellow",
                 }} />);
        }

        if (this.state.progressHolder) {
            console.log("Current state is", this.state.progressHolder);
            return (
                <div className="videoTimelineParent">
                    {tagTimeLines}
                </div>
            );
        } else {
            return <div />;
        }
    }
}
