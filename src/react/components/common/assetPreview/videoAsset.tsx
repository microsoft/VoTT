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
    autoPaused: boolean;
    seeking: boolean;
    currentTime: number;
}

export class VideoAsset extends React.Component<IVideoAssetProps> {
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
                        tooltip="Previous Tagged Frame"
                        onClick={this.movePreviousTaggedFrame}>
                        <i className="fas fa-caret-left fa-lg" />
                    </CustomVideoPlayerButton>
                    <CustomVideoPlayerButton order={8.2}
                        accelerator="ArrowRight"
                        tooltip="Next Tagged Frame"
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

    private movePreviousTaggedFrame = () => {
        const timestamp = this.videoPlayer.current.getState().player.currentTime;
        const previousFrame = _
            .reverse(this.props.childAssets)
            .find((asset) => asset.state === AssetState.Tagged && asset.timestamp < timestamp);

        if (previousFrame) {
            this.goToChildAsset(previousFrame);
        }
    }

    private moveNextTaggedFrame = () => {
        const timestamp = this.videoPlayer.current.getState().player.currentTime;
        const nextFrame = this.props.childAssets
            .find((asset) => asset.state === AssetState.Tagged && asset.timestamp > timestamp);

        if (nextFrame) {
            this.goToChildAsset(nextFrame);
        }
    }

    private seekToNextExpectedFrame = () => {
        // Seek forward from the current time to the next logical frame based on project settings
        const frameSkipTime: number = (1 / this.props.project.videoSettings.frameExtractionRate);
        const seekTime: number = (this.videoPlayer.current.getState().player.currentTime + frameSkipTime);
        this.seekToTime(seekTime);
    }

    private seekToPreviousExpectedFrame = () => {
        // Seek backwards from the current time to the next logical frame based on project settings
        const frameSkipTime: number = (1 / this.props.project.videoSettings.frameExtractionRate);
        const seekTime: number = (this.videoPlayer.current.getState().player.currentTime - frameSkipTime);
        this.seekToTime(seekTime);
    }

    private seekToTimestamp = () => {
        if (this.props.timestamp > 0) {
            this.seekToTime(this.props.timestamp);
        }
    }

    private goToChildAsset(asset: IAsset) {
        this.seekToTime(asset.timestamp);
    }

    private seekToTime(seekTime: number) {
        // Before seeking, pause the video
        if (!this.videoPlayer.current.getState().player.paused) {
            this.videoPlayer.current.pause();
        }
        this.videoPlayer.current.seek(seekTime);
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

        // Once the video is loaded, add any asset timeline tags
        this.addAssetTimelineTags(this.props.childAssets, this.videoPlayer.current.getState().player.duration);
    }

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

    private addAssetTimelineTags(childAssets: any[], videoDuration: number) {
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

        // Find the progress holder so we can add the markers to that
        const progressControls = document.getElementsByClassName("video-react-progress-control");
        let progressHolderElement: Element = null;

        // Find any that have an editor page content body type, this will be the one we use
        Array.from(progressControls).forEach( (element) => {
            let testingElement: Element = element;
            while (testingElement) {
                if (testingElement.className === "editor-page-content-body") {
                    progressHolderElement = element;
                }

                testingElement = testingElement.parentElement;
            }
        });

        // If we found an element to hold the tags, add them to it
        if (progressHolderElement) {
            const taggedAssetDiv = <div>{tagTimeLines}</div>;
            const renderedAssetDivs = ReactDOMServer.renderToStaticMarkup(taggedAssetDiv);
            const holderElement = document.createElement("div");
            holderElement.className = "video-timeline-parent";
            holderElement.innerHTML = renderedAssetDivs;
            progressHolderElement.appendChild(holderElement);
        }
    }
}
