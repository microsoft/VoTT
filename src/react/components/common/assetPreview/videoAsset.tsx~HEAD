import React from "react";
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
    };

    public state: IVideoAssetState = {
        loaded: false,
    };

    private videoPlayer: React.RefObject<Player> = React.createRef<Player>();

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
                    <CurrentTimeDisplay order={1.1} />
                    <TimeDivider order={1.2} />
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
        }
        if (this.props.timestamp !== prevProps.timestamp) {
            this.seekToTimestamp();
        }
    }

    /**
     * Bound to the "Next Tagged Frame" button
     * Seeks the user to the next tagged video frame
     */
    private movePreviousTaggedFrame = () => {
        const timestamp = this.videoPlayer.current.getState().player.currentTime;
        const previousFrame = _
            .reverse(this.props.childAssets)
            .find((asset) => asset.state === AssetState.Tagged && asset.timestamp < timestamp);

        if (previousFrame) {
            this.goToChildAsset(previousFrame);
        }
    }

    /**
     * Bound to the "Previous Tagged Frame" button
     * Seeks the user to the previous tagged video frame
     */
    private moveNextTaggedFrame = () => {
        const timestamp = this.videoPlayer.current.getState().player.currentTime;
        const nextFrame = this.props.childAssets
            .find((asset) => asset.state === AssetState.Tagged && asset.timestamp > timestamp);

        if (nextFrame) {
            this.goToChildAsset(nextFrame);
        }
    }

    /**
     * Seeks the video to the timestamp specified in the component properties
     */
    private seekToTimestamp = () => {
        if (this.props.timestamp > 0) {
            this.videoPlayer.current.pause();
            this.videoPlayer.current.seek(this.props.timestamp);
        }
    }

    /**
     * Seeks the video to the timestamp set by the specified asset
     * @param asset The child asset to seek to
     */
    private goToChildAsset(asset: IAsset) {
        this.videoPlayer.current.pause();
        this.videoPlayer.current.seek(asset.timestamp);
    }

    /**
     * Wired up to the underlying video "Player" component and receive notifications for all video state changes
     * @param state The current state of the video player component
     * @param state The previous state of the video player component
     */
    private onVideoStateChange = (state: Readonly<IVideoPlayerState>, prev: Readonly<IVideoPlayerState>) => {
        if (!this.state.loaded && state.readyState === 4 && state.readyState !== prev.readyState) {
            // Video initial load complete
            this.raiseLoaded();
            this.raiseActivated();
            this.seekToTimestamp();
        } else if (state.paused && (state.currentTime !== prev.currentTime || state.seeking !== prev.seeking)) {
            // Video is paused
            this.raiseChildAssetSelected(state);
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
}
