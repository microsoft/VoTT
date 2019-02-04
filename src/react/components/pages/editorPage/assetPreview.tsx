import React from "react";
import { IAsset, AssetType } from "../../../../models/applicationState";
import { strings } from "../../../../common/strings";
import { ImageAsset } from "./imageAsset";
import { VideoAsset } from "./videoAsset";

export type ContentSource = HTMLImageElement | HTMLVideoElement;

export interface IAssetProps {
    asset: IAsset;
    onAssetLoaded?: (contentSource: ContentSource) => void;
    onContentChanged?: (contentSource: ContentSource) => void;
}

export interface IAssetComponent {
    getContentSource(): HTMLImageElement | HTMLVideoElement;
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

    constructor(props, context) {
        super(props, context);

        this.state = {
            loaded: false,
        };

        this.onAssetLoad = this.onAssetLoad.bind(this);
    }

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
                    <ImageAsset asset={asset} onAssetLoaded={this.onAssetLoad} />
                }
                {asset.type === AssetType.Video &&
                    <VideoAsset asset={asset} onAssetLoaded={this.onAssetLoad} autoPlay={autoPlay} />
                }
                {asset.type === AssetType.Unknown &&
                    <div>{strings.editorPage.assetError}</div>
                }
            </div>
        );
    }

    private onAssetLoad(contentSource: ContentSource) {
        this.setState({
            loaded: true,
        }, () => {
            if (this.props.onAssetLoaded) {
                this.props.onAssetLoaded(contentSource);
            }
        });
    }
}
