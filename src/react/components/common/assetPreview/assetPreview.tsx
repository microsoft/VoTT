import React from "react";
import { IAsset, AssetType } from "../../../../models/applicationState";
import { strings } from "../../../../common/strings";
import { ImageAsset } from "./imageAsset";
import { VideoAsset } from "./videoAsset";
import { TFRecordAsset } from "./tfrecordAsset";

export type ContentSource = HTMLImageElement | HTMLVideoElement;

export interface IAssetProps {
    asset: IAsset;
    childAssets?: IAsset[];
    onLoaded?: (ContentSource: ContentSource) => void;
    onActivated?: (contentSource: ContentSource) => void;
    onDeactivated?: (contentSource: ContentSource) => void;
    onChildAssetSelected?: (asset: IAsset) => void;
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
 * @name - Asset Preview
 * @description - Small preview of assets for selection in editor page
 */
export class AssetPreview extends React.Component<IAssetPreviewProps, IAssetPreviewState> {
    public static defaultProps: IAssetPreviewProps = {
        asset: null,
        childAssets: [],
        autoPlay: false,
    };

    public state: IAssetPreviewState = {
        loaded: false,
    };

    public render() {
        const { loaded } = this.state;
        const { asset, childAssets, autoPlay } = this.props;
        const parentAsset = asset.parent || asset;

        return (
            <div className="asset-preview">
                {!loaded &&
                    <div className="asset-loading">
                        <i className="fas fa-circle-notch fa-spin" />
                    </div>
                }
                {asset.type === AssetType.Image &&
                    <ImageAsset asset={parentAsset}
                        onLoaded={this.onAssetLoad}
                        onActivated={this.props.onActivated}
                        onDeactivated={this.props.onDeactivated} />
                }
                {(asset.type === AssetType.Video || asset.type === AssetType.VideoFrame) &&
                    <VideoAsset asset={parentAsset}
                        childAssets={childAssets}
                        timestamp={asset.timestamp}
                        autoPlay={autoPlay}
                        onLoaded={this.onAssetLoad}
                        onChildAssetSelected={this.props.onChildAssetSelected}
                        onActivated={this.props.onActivated}
                        onDeactivated={this.props.onDeactivated} />
                }
                {asset.type === AssetType.TFRecord &&
                    <TFRecordAsset asset={asset}
                        onLoaded={this.onAssetLoad}
                        onActivated={this.props.onActivated}
                        onDeactivated={this.props.onDeactivated} />
                }
                {asset.type === AssetType.Unknown &&
                    <div className="asset-error">{strings.editorPage.assetError}</div>
                }
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
