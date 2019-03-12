import React, { SyntheticEvent } from "react";
import { IAssetProps } from "./assetPreview";
import { IAsset } from "../../../../models/applicationState";
import HtmlFileReader from "../../../../common/htmlFileReader";
import { TFRecordsReader } from "../../../../providers/export/tensorFlowRecords/tensorFlowReader";
import { FeatureType } from "../../../../providers/export/tensorFlowRecords/tensorFlowBuilder";

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
export class TFRecordAsset extends React.Component<IAssetProps, ITFRecordState> {
    public state: ITFRecordState = {
        tfRecordImage64: "",
    };

    private image: React.RefObject<HTMLImageElement> = React.createRef();

    public render() {
        return (
            <img ref={this.image}
                src={this.state.tfRecordImage64}
                onLoad={this.onLoad}
                onError={this.onError} />
        );
    }

    public async componentDidMount() {
        await this.updateImage();
    }

    public async componentDidUpdate(prevProps: Readonly<IAssetProps>) {
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

    private onError = (e: SyntheticEvent) => {
        if (this.props.onError) {
            this.props.onError(e);
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
