import React from "react";
import { IAssetProps } from "./assetPreview";
import { IAsset, AssetType } from "../../../../models/applicationState";
import HtmlFileReader from "../../../../common/htmlFileReader";
import { TFRecordsReader } from "../../../../providers/export/tensorFlowRecords/tensorFlowReader";
import { FeatureType } from "../../../../providers/export/tensorFlowRecords/tensorFlowBuilder";

export interface ITFRecordProps extends IAssetProps, React.ClassAttributes<TFRecordAsset> {
}

export interface ITFRecordState {
    tfRecordImage64: string;
}

export class TFRecordAsset extends React.Component<ITFRecordProps, ITFRecordState> {
    private image: React.RefObject<HTMLImageElement> = React.createRef();

    constructor(props, context) {
        super(props, context);
        this.state = {
            tfRecordImage64: "",
         };
    }

    public render() {
        const size = this.props.asset.size;
        let className = "";
        if (size) {
            className = size.width > size.height ? "landscape" : "portrait";
        }

        return (
            <div className="tfrecord-image" id={this.props.asset.id}>
                <img ref={this.image} className={className} src={this.state.tfRecordImage64} onLoad={this.onLoad} />
            </div>
        );
    }

    public async componentWillMount() {
        await this.updateImage();
    }

    public async componentWillUpdate() {
        await this.updateImage();
    }

    private async updateImage() {
        const tfRecordImage64 = await this.getTFRecordBase64Image(this.props.asset);
        const tfRecordDiv = document.getElementById(this.props.asset.id) as HTMLDivElement;
        const tfRecordImage = tfRecordDiv.getElementsByTagName("img")[0];
        // tfRecordImage.src = tfRecordImage64;

        this.setState({
            tfRecordImage64,
        });
    }

    private onLoad = () => {
        if (this.props.onLoaded) {
            this.props.onLoaded(this.image.current);
        }

        if (this.props.onActivated) {
            this.props.onActivated(this.image.current);
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
