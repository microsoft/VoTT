import React from "react";
import { IAsset, AssetType } from "../../../models/applicationState";
import { strings } from "../../../common/strings";
import { ImageAsset } from "./imageAsset";
import { VideoAsset } from "./videoAsset";
import { TFRecordAsset } from "./tfrecordAsset";

export type ContentSource = HTMLImageElement | HTMLVideoElement;

export interface IAssetProps {
    asset: IAsset;
    onLoaded?: (ContentSource: ContentSource) => void;
    onActivated?: (contentSource: ContentSource) => void;
    onDeactivated?: (contentSource: ContentSource) => void;
    onChildAssetSelected?: (asset: IAsset) => void;
}

/**
 * Properties for Asset Preview
 * @member asset - Asset for preview
 */
interface IAssetPreviewProps extends IAssetProps, React.Props<AssetPreview> {
    autoPlay: boolean;
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
    public static defaultProps: IAssetPreviewProps = {
        asset: null,
        autoPlay: false,
    };

    public state: IAssetPreviewState = {
        loaded: false,
    };

    public render() {
        const { loaded } = this.state;
        const { asset, autoPlay } = this.props;

        return (
            <div className="asset-preview">
                {!loaded &&
                    <div className="asset-loading">
                        <i className="fas fa-circle-notch fa-spin" />
                    </div>
                }
                {asset.type === AssetType.Image &&
                    <ImageAsset asset={asset}
                        onLoaded={this.onAssetLoad}
                        onActivated={this.props.onActivated}
                        onDeactivated={this.props.onDeactivated} />
                }
                {asset.type === AssetType.Video &&
                    <VideoAsset asset={asset}
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
                    <div>{strings.editorPage.assetError}</div>
                }
            </div>
        );
    }

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
