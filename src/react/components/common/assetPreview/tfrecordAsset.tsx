import React from "react";
import { IAssetProps } from "./assetPreview";
import { IAsset } from "../../../../models/applicationState";
import HtmlFileReader from "../../../../common/htmlFileReader";
import { TFRecordsReader } from "../../../../providers/export/tensorFlowRecords/tensorFlowReader";
import { FeatureType } from "../../../../providers/export/tensorFlowRecords/tensorFlowBuilder";

/**
 * State for TFRecord Asset Image component
 * @member tfRecordImage64 - base64 representation of the image data
 * @member hasError - Whether or not there was an error loading the image data from the tf record
 */
export interface ITFRecordState {
    tfRecordImage64: string;
    hasError: boolean;
}

/**
 * React component that displays an image from a TFRecord asset file
 */
export class TFRecordAsset extends React.Component<IAssetProps, ITFRecordState> {
    public state: ITFRecordState = {
        tfRecordImage64: "",
        hasError: false,
    };

    private image: React.RefObject<HTMLImageElement> = React.createRef();

    public render() {
        return (
            <img ref={this.image}
                src={this.state.tfRecordImage64}
                onLoad={this.onLoad}
                onError={this.onError}
                crossOrigin="anonymous" />
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

    private updateImage = async (): Promise<void> => {
        try {
            const base64ImageData = await this.getTFRecordBase64Image(this.props.asset);
            this.setState({
                tfRecordImage64: base64ImageData,
                hasError: !(!!base64ImageData),
            });
        } catch (e) {
            this.setState({
                hasError: true,
            });

            this.onError(e);
        }
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

    private onError = (e: React.SyntheticEvent<Element>) => {
        if (this.props.onError && (this.state.tfRecordImage64 || this.state.hasError)) {
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
