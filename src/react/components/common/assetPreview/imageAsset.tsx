import React from "react";
import { IAssetProps } from "./assetPreview";

/**
 * ImageAsset component used to render all image assets
 */
export class ImageAsset extends React.Component<IAssetProps> {
    private image: React.RefObject<HTMLImageElement> = React.createRef();

    public render() {
        return (
            <img ref={this.image}
                src={this.props.asset.path}
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
