import React from "react";
import ReactDOMServer from "react-dom/server";
import _ from "lodash";
import {
    Player, BigPlayButton, ControlBar, CurrentTimeDisplay,
    TimeDivider, PlaybackRateMenuButton, VolumeMenuButton,
} from "video-react";
import { IAssetProps } from "./assetPreview";
import { IAsset, AssetType, AssetState } from "../../../../models/applicationState";
import { AssetService } from "../../../../services/assetService";
import { CustomVideoPlayerButton } from "../../common/videoPlayer/customVideoPlayerButton";
import { strings } from "../../../../common/strings";

/**
 * VideoAsset component properties
 */
export interface IVideoAssetProps extends IAssetProps, React.Props<VideoAsset> {
    /** Whether or not the video asset should start playing automatically */
    autoPlay?: boolean;
    /** The timestamp that the video should seek to upon loading */
    timestamp?: number;
    /** The event handler that is fired when a child video frame is selected (ex. paused, seeked) */
    onChildAssetSelected?: (asset: IAsset) => void;
}

/** VideoAsset internal component state */
export interface IVideoAssetState {
    /** Whether or not the component has completed loading */
    loaded: boolean;
}

/**
 * VideoPlayer internal video state
 */
export interface IVideoPlayerState {
    readyState: number;
    paused: boolean;
    seeking: boolean;
    currentTime: number;
    duration: number;
}

/**
 * VideoAsset component used to display video based assets
 */
export class VideoAsset extends React.Component<IVideoAssetProps> {
    /** Default properties for the VideoAsset if not defined */
    public static defaultProps: IVideoAssetProps = {
        autoPlay: true,
        timestamp: 0,
        asset: null,
        childAssets: [],
        project: null,
    };

    public state: IVideoAssetState = {
        loaded: false,
    };

    private videoPlayer: React.RefObject<Player> = React.createRef<Player>();
    private timelineElement: Element = null;
    private currentVideoPlayerState: IVideoPlayerState = {
        readyState: 0,
        paused: true,
        seeking: false,
        currentTime: 0,
        duration: 0,
    };

    public render() {
        const { autoPlay, asset } = this.props;
        let videoPath = asset.path;
        if (!autoPlay) {
            videoPath += "#t=5.0";
        }

        return (
            <Player ref={this.videoPlayer}
                fluid={false}
                width="100%"
                height="100%"
                autoPlay={autoPlay}
                poster={""}
                src={videoPath}
            >
                <BigPlayButton position="center" />
                <ControlBar autoHide={false}>
                    <CustomVideoPlayerButton order={1.1}
                        tooltip={strings.editorPage.videoPlayer.previousExpectedFrame.tooltip}
                        onClick={this.movePreviousExpectedFrame}>
                        <i className="fas fa-caret-left fa-lg" />
                    </CustomVideoPlayerButton>
                    <CustomVideoPlayerButton order={1.2}
                        tooltip={strings.editorPage.videoPlayer.nextExpectedFrame.tooltip}
                        onClick={this.moveNextExpectedFrame}>
                        <i className="fas fa-caret-right fa-lg" />
                    </CustomVideoPlayerButton>
                    <CurrentTimeDisplay order={1.3} />
                    <TimeDivider order={1.4} />
                    <PlaybackRateMenuButton rates={[5, 2, 1, 0.5, 0.25]} order={7.1} />
                    <VolumeMenuButton enabled order={7.2} />
                    <CustomVideoPlayerButton order={8.1}
                        accelerator="ArrowLeft"
                        tooltip={strings.editorPage.videoPlayer.previousTaggedFrame.tooltip}
                        onClick={this.movePreviousTaggedFrame}>
                        <i className="fas fa-caret-left fa-lg" />
                    </CustomVideoPlayerButton>
                    <CustomVideoPlayerButton order={8.2}
                        accelerator="ArrowRight"
                        tooltip={strings.editorPage.videoPlayer.nextTaggedFrame.tooltip}
                        onClick={this.moveNextTaggedFrame}>
                        <i className="fas fa-caret-right fa-lg" />
                    </CustomVideoPlayerButton>
                </ControlBar>
            </Player>
        );
    }

    public componentDidMount() {
        this.videoPlayer.current.subscribeToStateChange(this.onVideoStateChange);
    }

    public componentDidUpdate(prevProps: Readonly<IVideoAssetProps>) {
        if (this.props.asset !== prevProps.asset) {
            this.setState({ loaded: false });
        } else if (this.props.childAssets !== prevProps.childAssets) {
            this.addAssetTimelineTags(this.props.childAssets, this.getCurrentVideoPlayerState().duration);
        }
        if (this.props.timestamp !== prevProps.timestamp) {
            this.seekToTimestamp();
        }
    }

    /**
     * Bound to the "Previous Tagged Frame" button
     * Seeks the user to the previous tagged video frame
     */
    private movePreviousTaggedFrame = () => {
        const timestamp = this.getCurrentVideoPlayerState().currentTime;
        const previousFrame = _
            .reverse(this.props.childAssets)
            .find((asset) => asset.state === AssetState.Tagged && asset.timestamp < timestamp);

        if (previousFrame) {
            this.goToChildAsset(previousFrame);
        }
    }

    /**
     * Bound to the "Next Tagged Frame" button
     * Seeks the user to the next tagged video frame
     */
    private moveNextTaggedFrame = () => {
        const timestamp = this.getCurrentVideoPlayerState().currentTime;
        const nextFrame = this.props.childAssets
            .find((asset) => asset.state === AssetState.Tagged && asset.timestamp > timestamp);

        if (nextFrame) {
            this.goToChildAsset(nextFrame);
        }
    }

    /**
     * @name - Move to the next expected frame
     * @description - Moves the videos current position forward one frame based on the current
     * project settings for frame rate extraction
     */
    private moveNextExpectedFrame = () => {
        // Seek forward from the current time to the next logical frame based on project settings
        const frameSkipTime: number = (1 / this.props.project.videoSettings.frameExtractionRate);
        const seekTime: number = (this.getCurrentVideoPlayerState().currentTime + frameSkipTime);
        this.seekToTime(seekTime);
    }

    /**
     * @name - Move to the previous expected frame
     * @description - Moves the videos current position backward one frame based on the current
     * project settings for frame rate extraction
     */
    private movePreviousExpectedFrame = () => {
        // Seek backwards from the current time to the next logical frame based on project settings
        const frameSkipTime: number = (1 / this.props.project.videoSettings.frameExtractionRate);
        const seekTime: number = (this.getCurrentVideoPlayerState().currentTime - frameSkipTime);
        this.seekToTime(seekTime);
    }

    /**
     * @name - Move to nearest child frame
     * @description - Move to the nearest tagged or visited frame from where the video's current
     * position is, within a certain threshold
     * @returns true if it moved position; false otherwise
     */
    private moveToNearestChildFrame(): boolean {
        const maximumThreshold = 1; // one second threhsold
        const timestamp = this.getCurrentVideoPlayerState().currentTime;
        let seekTime: number = timestamp;
        let nearestDifference = 2;
        for (const child of this.props.childAssets) {
            const childTimeDifference = Math.abs(child.timestamp - timestamp);
            if (childTimeDifference < maximumThreshold && childTimeDifference < nearestDifference) {
                nearestDifference = childTimeDifference;
                seekTime = child.timestamp;
            }
        }
        if (seekTime !== timestamp) {
            this.seekToTime(seekTime);
        }

        return seekTime !== timestamp;
    }

    /**
     * @name - Seek to timestamp
     * @description - Moves the videos current position to the position passed in via the props
     */
    private seekToTimestamp = () => {
        this.seekToTime(this.props.timestamp);
    }

    /**
     * @name - Go to child asset
     * @description - Moves the videos current position to a child asset
     * @member asset - the asset to move the position to
     */
    private goToChildAsset(asset: IAsset) {
        this.seekToTime(asset.timestamp);
    }

    /**
     * @name - Seek to time
     * @description - Seeks the current video to the passed in time stamp, pausing the video before hand
     * @member seekTime - Time (in seconds) in the video to seek to
     */
    private seekToTime(seekTime: number) {
        if (seekTime > 0) {
            // Before seeking, pause the video
            if (!this.getCurrentVideoPlayerState().paused) {
                this.videoPlayer.current.pause();
            }
            this.videoPlayer.current.seek(seekTime);
        }
    }

    private onVideoStateChange = (state: Readonly<IVideoPlayerState>, prev: Readonly<IVideoPlayerState>) => {
        // Store state for ease of retrieving later
        this.currentVideoPlayerState = state;
        if (!this.state.loaded && state.readyState === 4 && state.readyState !== prev.readyState) {
            // Video initial load complete
            this.raiseLoaded();
            this.raiseActivated();
            this.seekToTimestamp();
        } else if (state.paused && (state.currentTime !== prev.currentTime || state.seeking !== prev.seeking)) {
            // Video is paused, first try to move to a nearby frame if one exists
            if (!this.moveToNearestChildFrame()) {
                this.raiseChildAssetSelected(state);
            }
            this.raiseDeactivated();
        } else if (!state.paused && state.paused !== prev.paused) {
            // Video has resumed playing
            this.raiseActivated();
        }
    }

    /**
     * Raises the "loaded" event if available
     */
    private raiseLoaded = () => {
        this.setState({
            loaded: true,
        }, () => {
            if (this.props.onLoaded) {
                this.props.onLoaded(this.videoPlayer.current.video.video);
            }
        });

        // Once the video is loaded, add any asset timeline tags
        this.addAssetTimelineTags(this.props.childAssets, this.getCurrentVideoPlayerState().duration);
    }

    /**
     * Raises the "childAssetSelected" event if available
     */
    private raiseChildAssetSelected = (state: Readonly<IVideoPlayerState>) => {
        if (this.props.onChildAssetSelected) {
            const parentAsset = this.props.asset.parent || this.props.asset;
            const childPath = `${parentAsset.path}#t=${state.currentTime}`;
            const childAsset = AssetService.createAssetFromFilePath(childPath);
            childAsset.state = AssetState.Visited;
            childAsset.type = AssetType.VideoFrame;
            childAsset.parent = parentAsset;
            childAsset.timestamp = state.currentTime;
            childAsset.size = { ...this.props.asset.size };

            this.props.onChildAssetSelected(childAsset);
        }
    }

    /**
     * Raises the "activated" event if available
     */
    private raiseActivated = () => {
        if (this.props.onActivated) {
            this.props.onActivated(this.videoPlayer.current.video.video);
        }
    }

    /**
     * Raises the "deactivated event if available"
     */
    private raiseDeactivated = () => {
        if (this.props.onDeactivated) {
            this.props.onDeactivated(this.videoPlayer.current.video.video);
        }
    }

    /**
     * @name - Add Asset Timeline Tags
     * @description - Draws small lines to show where visited and tagged frames are on
     * the video line
     * @member childAssets - Array of child assets in the video
     * @member videoDuration - Length (in seconds) of the video
     */
    private addAssetTimelineTags(childAssets: any[], videoDuration: number) {
        const innerHtml: string = this.getRenderedAssetTagLinesText(childAssets, videoDuration);
        let progressHolderElement: Element = null;
        if (!this.timelineElement) {
            const editorElement = document.querySelector("div.editor-page-content-body");
            if (editorElement) {
                progressHolderElement = editorElement.getElementsByClassName("video-react-progress-control")[0];
            }
            // If we found an element to hold the tags, add them to it
            if (progressHolderElement) {
                this.timelineElement = document.createElement("div");
                this.timelineElement.className = "video-timeline-parent";
                this.timelineElement.innerHTML = innerHtml;
                progressHolderElement.appendChild(this.timelineElement);
            }
        } else {
            this.timelineElement.innerHTML = innerHtml;
        }
    }

    /**
     * @name - Get Rendered Asset Tag Lines Text
     * @description - Gets the HTML text for the rendered asset tag lines
     * @member childAssets - Array of child assets in the video
     * @member videoDuration - Length (in seconds) of the video
     */
    private getRenderedAssetTagLinesText(childAssets: any[], videoDuration: number): string {
        const tagTimeLines: any = [];

        // Add some markers for frames that have been visited with yellow and tagged with green
        for (const childAsset of childAssets) {
            // Calcualte the left position
            const childPosition: number = (childAsset.timestamp / videoDuration);
            tagTimeLines.push(<div key={childAsset.timestamp}
                className = {childAsset.state === AssetState.Tagged ?
                    "video-timeline-tagged" : "video-timeline-untagged"}
                style={{
                    left: (childPosition * 100) + "%",
                 }} />);
        }
        const taggedAssetDiv = <div>{tagTimeLines}</div>;
        return ReactDOMServer.renderToStaticMarkup(taggedAssetDiv);
    }

    private getCurrentVideoPlayerState(): Readonly<IVideoPlayerState> {
        return this.currentVideoPlayerState;
    }
}
