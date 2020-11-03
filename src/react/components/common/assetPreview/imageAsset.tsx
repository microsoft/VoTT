import React from "react";
import { IAssetProps } from "./assetPreview";
import { AssetService } from "../../../../services/assetService"

/**
 * ImageAsset component used to render all image assets
 */
export class ImageAsset extends React.Component<IAssetProps> {
    private image: React.RefObject<HTMLImageElement> = React.createRef();

    public render() {
        const { asset, project } = this.props;
        const assetAbsolutePath = AssetService.getAssetAbsolutePath(asset.path, project);
        console.warn(assetAbsolutePath);
        return (
            <img ref={this.image}
                src={assetAbsolutePath}
                onLoad={this.onLoad}
                onError={this.props.onError}
                crossOrigin="anonymous" />);
    }

    private onLoad = () => {
        if (this.props.onLoaded) {
            this.props.onLoaded(this.image.current);
        }
        if (this.props.onActivated) {
            this.props.onActivated(this.image.current);
        }
        if (this.props.onDeactivated) {
            this.props.onDeactivated(this.image.current);
        }
    }
}
