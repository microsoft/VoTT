import React from "react";
import { IAssetProps } from "./assetPreview";
import { ReactWrapper, mount } from "enzyme";
import { ImageAsset } from "./imageAsset";
import MockFactory from "../../../../common/mockFactory";

describe("Image Asset Component", () => {
    // tslint:disable-next-line:max-line-length
    const dataUri = "data:image/gif;base64,R0lGODlhEAAQAMQAAORHHOVSKudfOulrSOp3WOyDZu6QdvCchPGolfO0o/XBs/fNwfjZ0frl3/zy7////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAkAABAALAAAAAAQABAAAAVVICSOZGlCQAosJ6mu7fiyZeKqNKToQGDsM8hBADgUXoGAiqhSvp5QAnQKGIgUhwFUYLCVDFCrKUE1lBavAViFIDlTImbKC5Gm2hB0SlBCBMQiB0UjIQA7";
    let wrapper: ReactWrapper<IAssetProps> = null;
    const onLoadHandler = jest.fn();
    const onActivatedHandler = jest.fn();
    const onDeactivatedHandler = jest.fn();
    const onErrorHandler = jest.fn();

    MockFactory.createTestAsset("test");
    const defaultProps: IAssetProps = {
        asset: {
            ...MockFactory.createTestAsset("test"),
            path: dataUri,
        },
        onLoaded: onLoadHandler,
        onActivated: onActivatedHandler,
        onDeactivated: onDeactivatedHandler,
        onError: onErrorHandler,
    };

    function createComponent(props?: IAssetProps): ReactWrapper<IAssetProps> {
        props = props || defaultProps;
        return mount(<ImageAsset {...props} />);
    }

    it("raises onLoad handler when image has completed loading", () => {
        wrapper = createComponent();

        const img = wrapper.find("img").getDOMNode() as HTMLImageElement;
        img.dispatchEvent(new Event("load"));

        expect(onLoadHandler).toBeCalledWith(expect.any(HTMLImageElement));
    });

    it("raises onError handler when image fails to load", () => {
        wrapper = createComponent();

        const img = wrapper.find("img").getDOMNode() as HTMLImageElement;
        img.dispatchEvent(new Event("error"));

        expect(onErrorHandler).toBeCalled();
    });

    it("raises activated & deactivated life cycle events", async () => {
        wrapper = createComponent();

        const img = wrapper.find("img").getDOMNode() as HTMLImageElement;
        img.dispatchEvent(new Event("load"));

        await MockFactory.flushUi();

        expect(onActivatedHandler).toBeCalledWith(expect.any(HTMLImageElement));
        expect(onDeactivatedHandler).toBeCalledWith(expect.any(HTMLImageElement));
    });
});
