import React from "react";
import { IAsset, AssetType } from "../../../../models/applicationState";
import { strings } from "../../../../common/strings";

interface IAssetPreviewProps {
    asset: IAsset;
}

interface IAssetPreviewState {
    loaded: boolean;
}

export default class AssetPreview extends React.Component<IAssetPreviewProps, IAssetPreviewState> {
    constructor(props, context) {
        super(props, context);

        this.state = {
            loaded: false,
        };

        this.onAssetLoad = this.onAssetLoad.bind(this);
    }

    public render() {
        const { loaded } = this.state;
        const { asset } = this.props;

        return (
            <div className="asset-preview">
                {!loaded &&
                    <div className="asset-loading">
                        <i className="fas fa-circle-notch fa-spin" />
                    </div>
                }
                {asset.type === AssetType.Image &&
                    <img src={`file://#${asset.path.replace(/(^\w+:|^)\/\//, "")}`} onLoad={this.onAssetLoad} />
                }
                {asset.type === AssetType.Video &&
                    <video onLoadedData={this.onAssetLoad}>
                        <source src={`file://#${asset.path.replace(/(^\w+:|^)\/\//, "")}#t=5.0`} />
                    </video>
                }
                {asset.type === AssetType.Unknown &&
                    <div>{strings.editorPage.assetError}</div>
                }
            </div>
        );
    }

    private onAssetLoad() {
        this.setState({
            loaded: true,
        });
    }
}
