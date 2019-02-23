import React from "react";
import { ReactWrapper, mount } from "enzyme";
import { AssetPreview, IAssetPreviewProps, IAssetPreviewState } from "./assetPreview";
import MockFactory from "../../../../common/mockFactory";
import { ImageAsset } from "./imageAsset";
import { VideoAsset } from "./videoAsset";
import { AssetType } from "../../../../models/applicationState";

describe("Asset Preview Component", () => {
    let wrapper: ReactWrapper<IAssetPreviewProps, IAssetPreviewState> = null;
    // tslint:disable-next-line:max-line-length
    const dataUri = "data:image/gif;base64,R0lGODlhEAAQAMQAAORHHOVSKudfOulrSOp3WOyDZu6QdvCchPGolfO0o/XBs/fNwfjZ0frl3/zy7////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAkAABAALAAAAAAQABAAAAVVICSOZGlCQAosJ6mu7fiyZeKqNKToQGDsM8hBADgUXoGAiqhSvp5QAnQKGIgUhwFUYLCVDFCrKUE1lBavAViFIDlTImbKC5Gm2hB0SlBCBMQiB0UjIQA7";
    const onLoadedHandler = jest.fn();
    const onActivatedHandler = jest.fn();
    const onDeactivatedHandler = jest.fn();
    const onChildAssetSelectedHandler = jest.fn();

    const defaultProps: IAssetPreviewProps = {
        asset: {
            ...MockFactory.createTestAsset("test-image-asset"),
            path: dataUri,
        },
        autoPlay: false,
        onLoaded: onLoadedHandler,
        onActivated: onActivatedHandler,
        onDeactivated: onDeactivatedHandler,
        onChildAssetSelected: onChildAssetSelectedHandler,
    };

    function createComponent(props?: IAssetPreviewProps): ReactWrapper<IAssetPreviewProps, IAssetPreviewState> {
        props = props || defaultProps;
        return mount(<AssetPreview {...props} />);
    }

    it("renders an image asset when asset type is image", () => {
        wrapper = createComponent();
        expect(wrapper.find(ImageAsset).exists()).toBe(true);
    });

    it("renders a video asset when asset type is video", () => {
        const props: IAssetPreviewProps = {
            ...defaultProps,
            asset: MockFactory.createVideoTestAsset("test-video-asset"),
        };
        wrapper = createComponent(props);
        expect(wrapper.find(VideoAsset).exists()).toBe(true);
    });

    it("renders loading indicator if asset isn't fully loaded", () => {
        wrapper = createComponent();
        expect(wrapper.find(".asset-loading").exists()).toBe(true);
        expect(wrapper.state().loaded).toBe(false);
    });

    it("renders asset error string if asset type is unknown", () => {
        const props: IAssetPreviewProps = {
            ...defaultProps,
            asset: {
                ...MockFactory.createTestAsset("unknown-asset"),
                type: AssetType.Unknown,
            },
        };

        wrapper = createComponent(props);
        expect(wrapper.find(".asset-error").exists()).toBe(true);
    });

    it("raises asset loaded handler when image asset loading is complete", () => {
        wrapper = createComponent();
        wrapper.find(ImageAsset).props().onLoaded(document.createElement("img"));
        wrapper.update();

        expect(onLoadedHandler).toBeCalledWith(expect.any(HTMLImageElement));
        expect(wrapper.state().loaded).toBe(true);
        expect(wrapper.find(".asset-loading").exists()).toBe(false);
    });

    it("raises asset loaded handler when image asset loading is complete", () => {
        const props: IAssetPreviewProps = {
            ...defaultProps,
            asset: MockFactory.createVideoTestAsset("test-video-asset"),
        };
        wrapper = createComponent(props);
        wrapper.find(VideoAsset).props().onLoaded(document.createElement("video"));
        wrapper.update();

        expect(onLoadedHandler).toBeCalledWith(expect.any(HTMLVideoElement));
        expect(wrapper.state().loaded).toBe(true);
        expect(wrapper.find(".asset-loading").exists()).toBe(false);
    });

    it("raises activated handler when asset is activated", () => {
        wrapper = createComponent();
        wrapper.find(ImageAsset).props().onActivated(document.createElement("img"));

        expect(onActivatedHandler).toBeCalledWith(expect.any(HTMLImageElement));
    });

    it("raises deactivated handler when asset is deactivated", () => {
        wrapper = createComponent();
        wrapper.find(ImageAsset).props().onDeactivated(document.createElement("img"));

        expect(onDeactivatedHandler).toBeCalledWith(expect.any(HTMLImageElement));
    });

    it("raises child asset selected handler when a child asset is selected", () => {
        const props: IAssetPreviewProps = {
            ...defaultProps,
            asset: MockFactory.createVideoTestAsset("test-video-asset"),
        };
        wrapper = createComponent(props);
        const childAsset = MockFactory.createChildVideoAsset(props.asset, 10);
        wrapper.find(VideoAsset).props().onChildAssetSelected(childAsset);

        expect(onChildAssetSelectedHandler).toBeCalledWith(childAsset);
    });

    it("renders landscape asset correctly", () => {
        const props = { ...defaultProps };
        props.asset.size = {
            width: 800,
            height: 600,
        };

        wrapper = createComponent(props);
        const assetPreview = wrapper.find(".asset-preview");

        expect(assetPreview.exists()).toBe(true);
        expect(assetPreview.props().className).toContain("landscape");
    });

    it("renders portrait asset correctly", () => {
        const props = { ...defaultProps };
        props.asset.size = {
            width: 600,
            height: 800,
        };

        wrapper = createComponent(props);
        const assetPreview = wrapper.find(".asset-preview");

        expect(assetPreview.exists()).toBe(true);
        expect(assetPreview.props().className).toContain("portrait");
    });
});
