import React from "react";
import { IAssetProps } from "./assetPreview";
import { ReactWrapper, mount } from "enzyme";
import { TFRecordAsset } from "./tfrecordAsset";
import MockFactory from "../../../../common/mockFactory";
import { TFRecordsBuilder, FeatureType } from "../../../../providers/export/tensorFlowRecords/tensorFlowBuilder";
import HtmlFileReader from "../../../../common/htmlFileReader";

describe("Image Asset Component", () => {
    // tslint:disable-next-line:max-line-length
    const dataImage64 = "R0lGODlhEAAQAMQAAORHHOVSKudfOulrSOp3WOyDZu6QdvCchPGolfO0o/XBs/fNwfjZ0frl3/zy7////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAkAABAALAAAAAAQABAAAAVVICSOZGlCQAosJ6mu7fiyZeKqNKToQGDsM8hBADgUXoGAiqhSvp5QAnQKGIgUhwFUYLCVDFCrKUE1lBavAViFIDlTImbKC5Gm2hB0SlBCBMQiB0UjIQA7";
    const dataImage = new Uint8Array(Buffer.from(dataImage64, "base64"));

    // tslint:disable-next-line:max-line-length
    const dataUri = "data:image/gif;base64,R0lGODlhEAAQAMQAAORHHOVSKudfOulrSOp3WOyDZu6QdvCchPGolfO0o/XBs/fNwfjZ0frl3/zy7////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAkAABAALAAAAAAQABAAAAVVICSOZGlCQAosJ6mu7fiyZeKqNKToQGDsM8hBADgUXoGAiqhSvp5QAnQKGIgUhwFUYLCVDFCrKUE1lBavAViFIDlTImbKC5Gm2hB0SlBCBMQiB0UjIQA7";

    let tfrecords: Buffer;
    beforeEach(() => {
        let builder: TFRecordsBuilder;
        builder = new TFRecordsBuilder();
        builder.addFeature("image/encoded", FeatureType.Binary, dataImage);

        const buffer = builder.build();
        tfrecords = TFRecordsBuilder.buildTFRecords([buffer]);
    });

    HtmlFileReader.getAssetArray = jest.fn((asset) => {
        return Promise.resolve<Uint8Array>(new Uint8Array(tfrecords));
    });

    let wrapper: ReactWrapper<IAssetProps> = null;
    const onLoadHandler = jest.fn();
    MockFactory.createTestAsset("test");
    const defaultProps: IAssetProps = {
        asset: {
            ...MockFactory.createTestAsset("test"),
            path: "abc",
        },
        onLoaded: onLoadHandler,
    };

    function createComponent(props?: IAssetProps): ReactWrapper<IAssetProps> {
        props = props || defaultProps;
        return mount(<TFRecordAsset {...props} />);
    }

    it("renders landscape image correctly", () => {
        const props = { ...defaultProps };
        props.asset.size = {
            width: 800,
            height: 600,
        };

        wrapper = createComponent(props);
        const img = wrapper.find("img");

        expect(img.exists()).toBe(true);
        expect(img.props()).toEqual(expect.objectContaining({
            className: "landscape",
            src: dataUri,
        }));
    });

    it("renders portrait image correctly", () => {
        const props = { ...defaultProps };
        props.asset.size = {
            width: 600,
            height: 800,
        };

        wrapper = createComponent(props);
        const img = wrapper.find("img");

        expect(img.exists()).toBe(true);
        expect(img.props()).toEqual(expect.objectContaining({
            className: "portrait",
            src: dataUri,
        }));
    });

    it("raises onLoad handler when image has completed loading", () => {
        wrapper = createComponent();

        const img = wrapper.find("img").getDOMNode() as HTMLImageElement;
        img.dispatchEvent(new Event("load"));

        expect(onLoadHandler).toBeCalledWith(expect.any(HTMLImageElement));
    });
});
