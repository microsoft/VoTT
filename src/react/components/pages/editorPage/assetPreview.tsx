import React from "react";
import { IAsset, AssetType, IAssetVideoSettings } from "../../../../models/applicationState";
import { strings } from "../../../../common/strings";
import HtmlFileReader from "../../../../common/htmlFileReader";
import { TFRecordsReader } from "../../../../providers/export/tensorFlowRecords/tensorFlowReader";
import { FeatureType } from "../../../../providers/export/tensorFlowRecords/tensorFlowBuilder";

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

    constructor(props, context) {
        super(props, context);

        this.state = {
            loaded: false,
        };

        this.onAssetLoad = this.onAssetLoad.bind(this);
    }

    public async render() {
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
                    <img src={asset.path} onLoad={this.onAssetLoad} />
                }
                {asset.type === AssetType.Video &&
                    <video onLoadedData={this.onAssetLoad}>
                        <source src={`${asset.path}#t=5.0`} />
                    </video>
                }
                {asset.type === AssetType.TFRecord &&
                    <img src={await this.getTFRecordBase64Image(asset)} onLoad={this.onAssetLoad} />
                }
                {asset.type === AssetType.Unknown &&
                    <div>{strings.editorPage.assetError}</div>
                }
            </div>
        );
    }

    private async getTFRecordBase64Image(asset: IAsset): Promise<string> {
        const tfrecords = new Buffer(await HtmlFileReader.getAssetArray(asset));
        const reader = new TFRecordsReader(tfrecords);
        const buffer = reader.getFeature(0, "image/encoded", FeatureType.Binary) as Uint8Array;

        // Get Base64
        const image64 = btoa(buffer.reduce((data, byte) => data + String.fromCharCode(byte), ""));
        return "data:image;base64," + image64;
    }

    private onAssetLoad() {
        this.setState({
            loaded: true,
        });
    }
}
