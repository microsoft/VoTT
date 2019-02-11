import React from "react";
import { IAssetProps } from "./assetPreview";
import { IAsset, AssetType } from "../../../../models/applicationState";
import HtmlFileReader from "../../../../common/htmlFileReader";
import { TFRecordsReader } from "../../../../providers/export/tensorFlowRecords/tensorFlowReader";
import { FeatureType } from "../../../../providers/export/tensorFlowRecords/tensorFlowBuilder";

/**
 * Properties for TFRecord Asset Image component
 */
export interface ITFRecordProps extends IAssetProps, React.ClassAttributes<TFRecordAsset> {
}

/**
 * State for TFRecord Asset Image component
 * @member tfRecordImage64 - base64 representation of the image data
 */
export interface ITFRecordState {
    tfRecordImage64: string;
}

/**
 * React component that displays an image from a TFRecord asset file
 */
export class TFRecordAsset extends React.Component<ITFRecordProps, ITFRecordState> {
    public state: ITFRecordState = {
        tfRecordImage64: "",
    };

    private image: React.RefObject<HTMLImageElement> = React.createRef();

    public render() {
        const size = this.props.asset.size;
        let className = "";
        if (size) {
            className = size.width > size.height ? "landscape" : "portrait";
        }

        if (this.state.tfRecordImage64 !== "") {
            return (
                <img ref={this.image} className={className} src={this.state.tfRecordImage64} onLoad={this.onLoad} />
            );
        } else {
            return (
                <img ref={this.image} className={className} />
            );
        }
    }

    public async componentDidMount() {
        await this.updateImage();
    }

    public async componentDidUpdate(prevProps: Readonly<ITFRecordProps>) {
        if (this.props.asset !== prevProps.asset) {
            await this.updateImage();
        }
    }

    private async updateImage() {
        this.setState({
            tfRecordImage64: await this.getTFRecordBase64Image(this.props.asset),
        });
    }

    private onLoad = () => {
        if (this.props.onLoaded) {
            this.props.onLoaded(this.image.current);
        }
    }

    private async getTFRecordBase64Image(asset: IAsset): Promise<string> {
        const tfrecords = new Buffer(await HtmlFileReader.getAssetArray(asset));
        const reader = new TFRecordsReader(tfrecords);
        const buffer = reader.getFeature(0, "image/encoded", FeatureType.Binary) as Uint8Array;

        // Get Base64
        const image64 = btoa(buffer.reduce((data, byte) => data + String.fromCharCode(byte), ""));
        return "data:image;base64," + image64;
    }
}
