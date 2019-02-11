import React from "react";
import { IAsset, AssetType, IProject } from "../../../../models/applicationState";
import { strings } from "../../../../common/strings";
import { ImageAsset } from "./imageAsset";
import { VideoAsset } from "./videoAsset";

export type ContentSource = HTMLImageElement | HTMLVideoElement;

/**
 * AssetPreview component properties
 */
export interface IAssetProps {
    /** The current project */
    project: IProject;
    /** The Asset to preview */
    asset: IAsset;
    /** The child assets (ex. video frames) of the parent asset */
    childAssets?: IAsset[];
    /** Event handler that fires when the asset has been loaded */
    onLoaded?: (ContentSource: ContentSource) => void;
    /** Event handler that fires when the asset has been activated (ex. Video resumes playing) */
    onActivated?: (contentSource: ContentSource) => void;
    /** Event handler that fires when the asset has been deactivated (ex. Canvas tools takes over) */
    onDeactivated?: (contentSource: ContentSource) => void;
    /** Event handler that fires when a child asset is selected (ex. Paused on a video frame) */
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
    /** Default properties for component if not defined */
    public static defaultProps: IAssetPreviewProps = {
        project: null,
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
        const parentAsset = asset.parent || asset;

        return (
            <div className="asset-preview">
                {!loaded &&
                    <div className="asset-loading">
                        <i className="fas fa-circle-notch fa-spin" />
                    </div>
                }
                {asset.type === AssetType.Image &&
                    <ImageAsset project={this.props.project}
                        asset={parentAsset}
                        onLoaded={this.onAssetLoad}
                        onActivated={this.props.onActivated}
                        onDeactivated={this.props.onDeactivated} />
                }
                {(asset.type === AssetType.Video || asset.type === AssetType.VideoFrame) &&
                    <VideoAsset project={this.props.project}
                        asset={parentAsset}
                        childAssets={childAssets}
                        timestamp={asset.timestamp}
                        autoPlay={autoPlay}
                        onLoaded={this.onAssetLoad}
                        onChildAssetSelected={this.props.onChildAssetSelected}
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
