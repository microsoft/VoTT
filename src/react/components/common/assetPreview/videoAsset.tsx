import React from "react";
import ReactDOM from "react-dom";
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
        timestamp: -1,
        asset: null,
        childAssets: [],
    };

    public state: IVideoAssetState = {
        loaded: false,
    };

    private videoPlayer: React.RefObject<Player> = React.createRef<Player>();
    private timelineElement: Element = null;
    /** Current video player state, initialized to reasonable values */
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
                        accelerators={["ArrowLeft", "a", "A"]}
                        tooltip={strings.editorPage.videoPlayer.previousExpectedFrame.tooltip}
                        onClick={this.movePreviousExpectedFrame}>
                        <i className="fas fa-caret-left fa-lg" />
                    </CustomVideoPlayerButton>
                    <CustomVideoPlayerButton order={1.2}
                        accelerators={["ArrowRight", "d", "D"]}
                        tooltip={strings.editorPage.videoPlayer.nextExpectedFrame.tooltip}
                        onClick={this.moveNextExpectedFrame}>
                        <i className="fas fa-caret-right fa-lg" />
                    </CustomVideoPlayerButton>
                    <CurrentTimeDisplay order={1.3} />
                    <TimeDivider order={1.4} />
                    <PlaybackRateMenuButton rates={[5, 2, 1, 0.5, 0.25]} order={7.1} />
                    <VolumeMenuButton enabled order={7.2} />
                    <CustomVideoPlayerButton order={8.1}
                        accelerators={["q", "Q"]}
                        tooltip={strings.editorPage.videoPlayer.previousTaggedFrame.tooltip}
                        onClick={this.movePreviousTaggedFrame}>
                        <i className="fas fa-step-backward"></i>
                    </CustomVideoPlayerButton>
                    <CustomVideoPlayerButton order={8.2}
                        accelerators={["e", "E"]}
                        tooltip={strings.editorPage.videoPlayer.nextTaggedFrame.tooltip}
                        onClick={this.moveNextTaggedFrame}>
                        <i className="fas fa-step-forward"></i>
                    </CustomVideoPlayerButton>
                </ControlBar>
            </Player >
        );
    }

    public componentDidMount() {
        if (this.props.autoPlay) {
            // We only need to subscribe to state change notificeations if autoPlay
            // is true, otherwise the video is simply a preview on the side bar that
            // doesn't change
            this.videoPlayer.current.subscribeToStateChange(this.onVideoStateChange);
        }
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
        const frameSkipTime: number = (1 / this.props.additionalSettings.videoSettings.frameExtractionRate);
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
        const frameSkipTime: number = (1 / this.props.additionalSettings.videoSettings.frameExtractionRate);
        const seekTime: number = (this.getCurrentVideoPlayerState().currentTime - frameSkipTime);
        this.seekToTime(seekTime);
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
        if (seekTime >= 0) {
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
            // Video is paused, make sure we are on a key frame, and if we are not, seek to that
            // before raising the child selected event
            if (!this.ensureSeekIsOnValidKeyframe()) {
                this.raiseChildAssetSelected(state);
                this.raiseDeactivated();
            }
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

            // Once the video is loaded, add any asset timeline tags
            this.addAssetTimelineTags(this.props.childAssets, this.getCurrentVideoPlayerState().duration);
        });
    }

    /**
     * Raises the "childAssetSelected" event if available
     */
    private raiseChildAssetSelected = (state: Readonly<IVideoPlayerState>) => {
        if (this.props.onChildAssetSelected) {
            const rootAsset = this.props.asset.parent || this.props.asset;
            const childPath = `${rootAsset.path}#t=${state.currentTime}`;
            const childAsset = AssetService.createAssetFromFilePath(childPath);
            childAsset.state = AssetState.Visited;
            childAsset.type = AssetType.VideoFrame;
            childAsset.parent = rootAsset;
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
     * @name - Ensure seek is on valid keyframe
     * @description - Move to the nearest key frame from where the video's current
     * position is
     * @returns true if moved to a new position; false otherwise
     */
    private ensureSeekIsOnValidKeyframe(): boolean {
        if (!this.props.additionalSettings) {
            return false;
        }
        const keyFrameTime = (1 / this.props.additionalSettings.videoSettings.frameExtractionRate);
        const timestamp = this.getCurrentVideoPlayerState().currentTime;

        // Calculate the nearest key frame
        const numberKeyFrames = Math.round(timestamp / keyFrameTime);
        const seekTime = +(numberKeyFrames * keyFrameTime).toFixed(6);
        if (seekTime !== timestamp) {
            this.seekToTime(seekTime);
        }

        return seekTime !== timestamp;
    }

    /**
     * @name - Add Asset Timeline Tags
     * @description - Draws small lines to show where visited and tagged frames are on
     * the video line
     * @member childAssets - Array of child assets in the video
     * @member videoDuration - Length (in seconds) of the video
     */
    private addAssetTimelineTags(childAssets: any[], videoDuration: number) {
        if (!this.props.autoPlay) {
            return;
        }

        const assetTimelineTagLines = this.getRenderedAssetTagLinesElements(childAssets, videoDuration);
        const timelineSelector = ".editor-page-content-body .video-react-progress-control .video-timeline-root";
        this.timelineElement = document.querySelector(timelineSelector);

        if (!this.timelineElement) {
            const progressControlSelector = ".editor-page-content-body .video-react-progress-control";
            const progressHolderElement = document.querySelector(progressControlSelector);

            // If we found an element to hold the tags, add them to it
            if (progressHolderElement) {
                this.timelineElement = document.createElement("div");
                this.timelineElement.className = "video-timeline-root";
                progressHolderElement.appendChild(this.timelineElement);
            }
        }

        if (this.timelineElement) {
            // Render the child asset elmements to the dom
            ReactDOM.render(assetTimelineTagLines, this.timelineElement);
        }
    }

    /**
     * @name - Get Rendered Asset Tag Lines Elements
     * @description - Gets the elements for the rendered asset tag lines
     * @member childAssets - Array of child assets in the video
     * @member videoDuration - Length (in seconds) of the video
     */
    private getRenderedAssetTagLinesElements(childAssets: any[], videoDuration: number) {
        const tagTimeLines: any = [];

        // Add some markers for frames that have been visited with yellow and tagged with green
        for (const childAsset of childAssets) {
            // Calcualte the left position
            const childPosition: number = (childAsset.timestamp / videoDuration);
            tagTimeLines.push(<div key={childAsset.timestamp}
                onClick={this.handleAssetTimelineClick}
                data-videotimestamp={childAsset.timestamp}
                className={childAsset.state === AssetState.Tagged ?
                    "video-timeline-tagged" : "video-timeline-untagged"}
                style={{
                    left: (childPosition * 100) + "%",
                }} />);
        }
        return <div className={"video-timeline-container"}>{tagTimeLines}</div>;
    }

    private handleAssetTimelineClick = (divElement: React.MouseEvent<HTMLDivElement>) => {
        const videoDuration: number = parseFloat(divElement.currentTarget.dataset["videotimestamp"]);
        this.seekToTime(videoDuration);
    }

    private getCurrentVideoPlayerState(): Readonly<IVideoPlayerState> {
        return this.currentVideoPlayerState;
    }
}
