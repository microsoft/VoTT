import React from "react";
import { IAssetProps } from "./assetPreview";
import { ReactWrapper, mount } from "enzyme";
import { TFRecordAsset, ITFRecordState } from "./tfrecordAsset";
import MockFactory from "../../../../common/mockFactory";
import { TFRecordsBuilder, FeatureType } from "../../../../providers/export/tensorFlowRecords/tensorFlowBuilder";
import HtmlFileReader from "../../../../common/htmlFileReader";

describe("TFRecord Asset Component", () => {
    // tslint:disable-next-line:max-line-length
    const dataImage64 = "R0lGODlhEAAQAMQAAORHHOVSKudfOulrSOp3WOyDZu6QdvCchPGolfO0o/XBs/fNwfjZ0frl3/zy7////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAkAABAALAAAAAAQABAAAAVVICSOZGlCQAosJ6mu7fiyZeKqNKToQGDsM8hBADgUXoGAiqhSvp5QAnQKGIgUhwFUYLCVDFCrKUE1lBavAViFIDlTImbKC5Gm2hB0SlBCBMQiB0UjIQA7";
    const dataImage = new Uint8Array(Buffer.from(dataImage64, "base64"));
    const dataUri = "data:image;base64," + dataImage64;

    let wrapper: ReactWrapper<IAssetProps> = null;

    const onLoadHandler = jest.fn();
    const onActivatedHandler = jest.fn();
    const onDeactivatedHandler = jest.fn();
    const onErrorHandler = jest.fn();

    let tfRecords: Buffer;
    beforeEach(() => {
        let builder: TFRecordsBuilder;
        builder = new TFRecordsBuilder();
        builder.addFeature("image/encoded", FeatureType.Binary, dataImage);

        const buffer = builder.build();
        tfRecords = TFRecordsBuilder.buildTFRecords([buffer]);

        onLoadHandler.mockClear();
        onErrorHandler.mockClear();
    });

    HtmlFileReader.getAssetArray = jest.fn((asset) => {
        return Promise.resolve<ArrayBuffer>(new Uint8Array(tfRecords).buffer);
    });

    const defaultProps: IAssetProps = {
        asset: {
            ...MockFactory.createTestAsset("test"),
            path: "abc",
        },
        onLoaded: onLoadHandler,
        onActivated: onActivatedHandler,
        onDeactivated: onDeactivatedHandler,
        onError: onErrorHandler,
    };

    function createComponent(props?: IAssetProps): ReactWrapper<IAssetProps, ITFRecordState> {
        props = props || defaultProps;
        return mount(<TFRecordAsset {...props} />);
    }

    it("load image correctly", async () => {
        const props = { ...defaultProps };

        wrapper = createComponent(props);
        await MockFactory.flushUi();

        const img = wrapper.find("img");
        expect(img.exists()).toBe(true);

        expect(wrapper.state()).toEqual(expect.objectContaining({
            tfRecordImage64: dataUri,
        }));
    });

    it("raises onLoad handler when image has completed loading", async () => {
        wrapper = createComponent();
        await MockFactory.flushUi();

        const img = wrapper.find("img").getDOMNode() as HTMLImageElement;
        img.dispatchEvent(new Event("load"));

        expect(onLoadHandler).toBeCalledWith(expect.any(HTMLImageElement));
    });

    it("raises activated & deactivated life cycle events", async () => {
        wrapper = createComponent();
        await MockFactory.flushUi();

        const img = wrapper.find("img").getDOMNode() as HTMLImageElement;
        img.dispatchEvent(new Event("load"));

        expect(onActivatedHandler).toBeCalledWith(expect.any(HTMLImageElement));
        expect(onDeactivatedHandler).toBeCalledWith(expect.any(HTMLImageElement));
    });

    it("raises onError handler when the image has an error", async () => {
        wrapper = createComponent();
        await MockFactory.flushUi();

        const img = wrapper.find("img").getDOMNode() as HTMLImageElement;
        img.dispatchEvent(new Event("error"));

        expect(onErrorHandler).toBeCalled();
    });

    it("raises onError handler when there is an error reading image data from tf record", async () => {
        HtmlFileReader.getAssetArray = jest.fn(() => Promise.resolve());

        wrapper = createComponent();
        await MockFactory.flushUi();

        expect(onErrorHandler).toBeCalled();
    });

    it("does not raise onError handler when there the tf record has not yet been read", async () => {
        wrapper = createComponent();

        const img = wrapper.find("img").getDOMNode() as HTMLImageElement;
        img.dispatchEvent(new Event("error"));

        expect(onErrorHandler).not.toBeCalled();
    });
});
