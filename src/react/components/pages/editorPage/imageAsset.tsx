import React from "react";
import { IAssetProps, IAssetComponent } from "./assetPreview";

export interface IImageProps extends IAssetProps, React.ClassAttributes<ImageAsset> {
}

export class ImageAsset extends React.Component<IImageProps> implements IAssetComponent {
    private image: React.RefObject<HTMLImageElement> = React.createRef();

    public render() {
        const size = this.props.asset.size;
        let className = "";
        if (size) {
            className = size.width > size.height ? "landscape" : "portrait";
        }

        return (<img ref={this.image} className={className} src={this.props.asset.path} onLoad={this.onLoad} />);
    }

    public getContentSource = () => {
        return this.image.current;
    }

    private onLoad = () => {
        if (this.props.onAssetLoaded) {
            this.props.onAssetLoaded(this.image.current);
        }
    }
}
