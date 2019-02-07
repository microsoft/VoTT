import React, { Fragment } from "react";
import {
    Player, BigPlayButton, ControlBar, CurrentTimeDisplay,
    TimeDivider, PlaybackRateMenuButton, VolumeMenuButton,
} from "video-react";
import { IAssetProps } from "./assetPreview";
import { IAsset, AssetType } from "../../../../models/applicationState";
import { AssetService } from "../../../../services/assetService";

export interface IVideoAssetProps extends IAssetProps, React.Props<VideoAsset> {
    autoPlay?: boolean;
    timestamp?: number;
    onChildAssetSelected?: (asset: IAsset) => void;
}

export interface IVideoAssetState {
    loaded: boolean;
}

export interface IVideoPlayerState {
    readyState: number;
    paused: boolean;
    seeking: boolean;
    currentTime: number;
}

export class VideoAsset extends React.Component<IVideoAssetProps> {
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
            <Fragment>
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
                    </ControlBar>
                </Player>
                <div style={{ position: "absolute", top: 0, left: 0, width: "100%", zIndex: 2 }}>
                    {this.props.childAssets.map((asset, i) => {
                        return (
                            <button key={asset.id} onClick={() => this.goToChildAsset(asset)}>{asset.timestamp}</button>
                        );
                    })}
                </div>
            </Fragment >
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

    private seekToTimestamp = () => {
        if (this.props.timestamp > 0) {
            this.videoPlayer.current.pause();
            this.videoPlayer.current.seek(this.props.timestamp);
        }
    }

    private goToChildAsset(asset: IAsset) {
        this.videoPlayer.current.pause();
        this.videoPlayer.current.seek(asset.timestamp);
    }

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

    private raiseLoaded = () => {
        this.setState({
            loaded: true,
        }, () => {
            if (this.props.onLoaded) {
                this.props.onLoaded(this.videoPlayer.current.video.video);
            }
        });
    }

    private raiseChildAssetSelected = (state: Readonly<IVideoPlayerState>) => {
        if (this.props.onChildAssetSelected) {
            const parentAsset = this.props.asset.parent || this.props.asset;
            const childPath = `${parentAsset.path}#t=${state.currentTime}`;
            const childAsset = AssetService.createAssetFromFilePath(childPath);
            childAsset.type = AssetType.VideoFrame;
            childAsset.parent = parentAsset;
            childAsset.timestamp = state.currentTime;
            childAsset.size = { ...this.props.asset.size };

            this.props.onChildAssetSelected(childAsset);
        }
    }

    private raiseActivated = () => {
        if (this.props.onActivated) {
            this.props.onActivated(this.videoPlayer.current.video.video);
        }
    }

    private raiseDeactivated = () => {
        if (this.props.onDeactivated) {
            this.props.onDeactivated(this.videoPlayer.current.video.video);
        }
    }
}
