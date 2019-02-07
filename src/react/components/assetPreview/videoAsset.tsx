import React from "react";
import {
    Player, BigPlayButton, ControlBar, CurrentTimeDisplay,
    TimeDivider, PlaybackRateMenuButton, VolumeMenuButton,
} from "video-react";
import { IAssetProps } from "./assetPreview";
<<<<<<< HEAD:src/react/components/pages/editorPage/videoAsset.tsx
import { IAsset } from "../../../../models/applicationState";
import { AssetService } from "../../../../services/assetService";
=======
import { IAsset, AssetType, AssetState } from "../../../models/applicationState";
import { AssetService } from "../../../services/assetService";
import { CustomVideoPlayerButton } from "../common/videoPlayer/customVideoPlayerButton";
>>>>>>> Wabrez/video test coverage (#549):src/react/components/assetPreview/videoAsset.tsx

export interface IVideoAssetProps extends IAssetProps, React.Props<VideoAsset> {
    autoPlay?: boolean;
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
        asset: null,
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
    }

    private onVideoStateChange = (state: Readonly<IVideoPlayerState>, prev: Readonly<IVideoPlayerState>) => {
        if (!this.state.loaded && state.readyState === 4 && state.readyState !== prev.readyState) {
            // Video initial load complete
            this.raiseLoaded();
            this.raiseActivated();
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
            const childPath = `${this.props.asset.path}#t=${state.currentTime}`;
            const childAsset = AssetService.createAssetFromFilePath(childPath);
<<<<<<< HEAD:src/react/components/pages/editorPage/videoAsset.tsx
            childAsset.parent = this.props.asset.parent || this.props.asset.id;
=======
            childAsset.state = AssetState.Visited;
            childAsset.type = AssetType.VideoFrame;
            childAsset.parent = parentAsset;
>>>>>>> Wabrez/video test coverage (#549):src/react/components/assetPreview/videoAsset.tsx
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
