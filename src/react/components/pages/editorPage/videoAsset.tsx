import React from "react";
import {
    Player, BigPlayButton, ControlBar, CurrentTimeDisplay,
    TimeDivider, PlaybackRateMenuButton, VolumeMenuButton,
} from "video-react";
import { IAssetProps, IAssetComponent } from "./assetPreview";

export interface IVideoAssetProps extends IAssetProps, React.Props<VideoAsset> {
    autoPlay?: boolean;
}

export class VideoAsset extends React.Component<IVideoAssetProps> implements IAssetComponent {
    public static defaultProps: IVideoAssetProps = {
        autoPlay: true,
        asset: null,
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
                <ControlBar>
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

    public getContentSource = () => {
        return this.videoPlayer.current.video.video;
    }

    private onVideoStateChange = (state, prev) => {
        if (state.readyState === 4 && this.props.onAssetLoaded) {
            this.props.onAssetLoaded(this.videoPlayer.current.video.video);
        }
        if (state.paused && (state.currentTime !== prev.currentTime || state.seeking !== prev.seeking)) {
            this.onContentChanged();
        } else if (!state.paused && state.paused !== prev.paused) {

        }
    }

    private onContentChanged = () => {
        if (this.props.onContentChanged) {
            this.props.onContentChanged(this.videoPlayer.current.video.video);
        }
    }
}
