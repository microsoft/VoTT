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
    MockFactory.createTestAsset("test");
    const defaultProps: IAssetProps = {
        asset: {
            ...MockFactory.createTestAsset("test"),
            path: dataUri,
        },
        onLoaded: onLoadHandler,
    };

    function createComponent(props?: IAssetProps): ReactWrapper<IAssetProps> {
        props = props || defaultProps;
        return mount(<ImageAsset {...props} />);
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
            src: defaultProps.asset.path,
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
            src: defaultProps.asset.path,
        }));
    });

    it("raises onLoad handler when image has completed loading", () => {
        wrapper = createComponent();

        const img = wrapper.find("img").getDOMNode() as HTMLImageElement;
        img.dispatchEvent(new Event("load"));

        expect(onLoadHandler).toBeCalledWith(expect.any(HTMLImageElement));
    });
});
