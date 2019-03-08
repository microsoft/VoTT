import React from "react";
import { IAsset, AssetType, IProjectVideoSettings } from "../../../../models/applicationState";
import { strings } from "../../../../common/strings";
import { ImageAsset } from "./imageAsset";
import { VideoAsset } from "./videoAsset";
import { TFRecordAsset } from "./tfrecordAsset";

export type ContentSource = HTMLImageElement | HTMLVideoElement;

/**
 * AssetPreview component properties
 */
export interface IAssetProps {
    /** The Asset to preview */
    asset: IAsset;
    /** The child assets (ex. video frames) of the parent asset */
    childAssets?: IAsset[];
    /** Additional settings for this asset */
    additionalSettings?: IAssetPreviewSettings;
    /** Event handler that fires when the asset has been loaded */
    onLoaded?: (ContentSource: ContentSource) => void;
    /** Event handler that fires when the asset has been activated (ex. Video resumes playing) */
    onActivated?: (contentSource: ContentSource) => void;
    /** Event handler that fires when the asset has been deactivated (ex. Canvas tools takes over) */
    onDeactivated?: (contentSource: ContentSource) => void;
    /** Event handler that fires when a child asset is selected (ex. Paused on a video frame) */
    onChildAssetSelected?: (asset: IAsset) => void;
    onAssetError?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
}

/**
 * Properties for Asset Preview
 * @member asset - Asset for preview
 */
export interface IAssetPreviewProps extends IAssetProps, React.Props<AssetPreview> {
    autoPlay?: boolean;
}

/**
 * State for Asset Preview
 * @member loaded - Asset is loaded
 */
export interface IAssetPreviewState {
    loaded: boolean;
}

/**
 * Settings used by the various asset previews
 * @member videoSettings - Video settings for this asset
 */
export interface IAssetPreviewSettings {
    videoSettings: IProjectVideoSettings;
}

/**
 * @name - Asset Preview
 * @description - Small preview of assets for selection in editor page
 */
export class AssetPreview extends React.Component<IAssetPreviewProps, IAssetPreviewState> {
    /** Default properties for component if not defined */
    public static defaultProps: IAssetPreviewProps = {
        asset: null,
        childAssets: [],
        autoPlay: false,
    };

    /** The internal state for the component */
    public state: IAssetPreviewState = {
        loaded: false,
    };

    public render() {
        const { loaded } = this.state;
        const { asset, childAssets, autoPlay } = this.props;
        const rootAsset = asset.parent || asset;
        const size = this.props.asset.size;
        const classNames = ["asset-preview"];
        if (size) {
            if (size.width > size.height) {
                classNames.push("landscape");
            } else {
                classNames.push("portrait");
            }
        }

        return (
            <div className={classNames.join(" ")}>
                <div className="asset-preview-container">
                    {!loaded && !asset.hasError &&
                        <div className="asset-loading">
                            <i className="fas fa-circle-notch fa-spin" />
                        </div>
                    }
                    {!asset.hasError ?
                        (() => {
                            switch (asset.type) {
                                case AssetType.Image:
                                    return <ImageAsset asset={rootAsset}
                                        additionalSettings={this.props.additionalSettings}
                                        onLoaded={this.onAssetLoad}
                                        onActivated={this.props.onActivated}
                                        onDeactivated={this.props.onDeactivated} />;
                                case AssetType.Video:
                                case AssetType.VideoFrame:
                                    return <VideoAsset asset={rootAsset}
                                        additionalSettings={this.props.additionalSettings}
                                        childAssets={childAssets}
                                        timestamp={asset.timestamp}
                                        autoPlay={autoPlay}
                                        onLoaded={this.onAssetLoad}
                                        onChildAssetSelected={this.props.onChildAssetSelected}
                                        onActivated={this.props.onActivated}
                                        onDeactivated={this.props.onDeactivated} />;
                                case AssetType.TFRecord:
                                    return <TFRecordAsset asset={asset}
                                        onLoaded={this.onAssetLoad}
                                        onActivated={this.props.onActivated}
                                        onDeactivated={this.props.onDeactivated} />;
                                default:
                                    return <div className="asset-error">{strings.editorPage.assetError}</div>;
                            }
                        })() : <div className="asset-error">{strings.editorPage.assetError}</div>}
                </div>
            </div>
        );
    }
    /**
     * Internal event handler for when the referenced asset has been loaded
     * @param contentSource The visual HTML element of the asset (img/video tag)
     */
    private onAssetLoad = (contentSource: ContentSource) => {
        this.setState({
            loaded: true,
        }, () => {
            if (this.props.onLoaded) {
                this.props.onLoaded(contentSource);
            }
        });
    }
}
