import React from "react";
import { IAsset, AssetType, IAssetVideoSettings } from "../../../../models/applicationState";
import { strings } from "../../../../common/strings";
import { Player, ControlBar, CurrentTimeDisplay, TimeDivider,
    BigPlayButton, PlaybackRateMenuButton, VolumeMenuButton } from "video-react";

/**
 * Properties for Asset Preview
 * @member asset - Asset for preview
 */
interface IAssetPreviewProps {
    asset: IAsset;
    videoSettings: IAssetVideoSettings;
}

/**
 * State for Asset Preview
 * @member loaded - Asset is loaded
 */
interface IAssetPreviewState {
    loaded: boolean;
}

/**
 * @name - Asset Preview
 * @description - Small preview of assets for selection in editor page
 */
export default class AssetPreview extends React.Component<IAssetPreviewProps, IAssetPreviewState> {
    private playerRef: React.RefObject<Player>;

    constructor(props, context) {
        super(props, context);

        this.state = {
            loaded: false,
        };

        this.onAssetLoad = this.onAssetLoad.bind(this);
        this.playerRef = React.createRef<Player>();
    }

    public render() {
        const { loaded } = this.state;
        const { asset } = this.props;
        const { videoSettings } = this.props;

        return (
            <div className="asset-preview">
                {!loaded &&
                    <div className="asset-loading">
                        <i className="fas fa-circle-notch fa-spin" />
                    </div>
                }
                {asset.type === AssetType.Image &&
                    <img src={this.checkAssetPathProtocol(asset.path)} onLoad={this.onAssetLoad} />
                }
                {asset.type === AssetType.Video &&
                    <Player ref={this.playerRef}
                        fluid={true}
                        autoPlay={videoSettings.shouldAutoPlayVideo}
                        poster={videoSettings.posterSource}
                        src={`${this.checkAssetPathProtocol(asset.path)}`}
                    >
                    <BigPlayButton position="center" />
                    {videoSettings.shouldShowPlayControls &&
                        <ControlBar>
                            <CurrentTimeDisplay order={1.1} />
                            <TimeDivider order={1.2} />
                            <PlaybackRateMenuButton rates={[5, 2, 1, 0.5, 0.25]} order={7.1} />
                            <VolumeMenuButton enabled order={7.2} />
                        </ControlBar>
                    }
                    </Player>
                }
                {asset.type === AssetType.Unknown &&
                    <div>{strings.editorPage.assetError}</div>
                }
            </div>
        );
    }

    public componentDidMount() {
        // subscribe state change for the video if it has been loaded
        if (this.playerRef && this.playerRef.current) {
            this.playerRef.current.subscribeToStateChange(this.handleVideoStateChange.bind(this));
        }
    }

    private handleVideoStateChange(state, previousState) {
        // When we have a duration, and we've buffered some data, we will mark
        // the asset as loaded
        if ((state.duration > 0) && (state.buffered.length > 0)) {
            this.setState({
                loaded: true,
            });
        }
    }

    private checkAssetPathProtocol(assetPath: string): string {
        if (assetPath.toLowerCase().startsWith("http://") || assetPath.toLowerCase().startsWith("https://")) {
            return assetPath;
        }
        return "file://" + assetPath;
    }

    private onAssetLoad() {
        this.setState({
            loaded: true,
        });
    }
}
