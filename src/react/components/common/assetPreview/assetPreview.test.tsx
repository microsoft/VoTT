import React from "react";
import { ReactWrapper, mount } from "enzyme";
import { AssetPreview, IAssetPreviewProps, IAssetPreviewState } from "./assetPreview";
import MockFactory from "../../../../common/mockFactory";
import { ImageAsset } from "./imageAsset";
import { VideoAsset } from "./videoAsset";
import { AssetType, AssetState } from "../../../../models/applicationState";
import { TFRecordAsset } from "./tfrecordAsset";

describe("Asset Preview Component", () => {
    let wrapper: ReactWrapper<IAssetPreviewProps, IAssetPreviewState> = null;
    // tslint:disable-next-line:max-line-length
    const dataUri = "data:image/gif;base64,R0lGODlhEAAQAMQAAORHHOVSKudfOulrSOp3WOyDZu6QdvCchPGolfO0o/XBs/fNwfjZ0frl3/zy7////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAkAABAALAAAAAAQABAAAAVVICSOZGlCQAosJ6mu7fiyZeKqNKToQGDsM8hBADgUXoGAiqhSvp5QAnQKGIgUhwFUYLCVDFCrKUE1lBavAViFIDlTImbKC5Gm2hB0SlBCBMQiB0UjIQA7";
    const onLoadedHandler = jest.fn();
    const onErrorHandler = jest.fn();
    const onActivatedHandler = jest.fn();
    const onDeactivatedHandler = jest.fn();
    const onChildAssetSelectedHandler = jest.fn();
    const onAssetChangedHandler = jest.fn();
    const onBeforeAssetChangedHandler = jest.fn(() => true);

    const defaultProps: IAssetPreviewProps = {
        asset: {
            ...MockFactory.createTestAsset("test-image-asset"),
            path: dataUri,
        },
        autoPlay: false,
        controlsEnabled: true,
        onLoaded: onLoadedHandler,
        onError: onErrorHandler,
        onActivated: onActivatedHandler,
        onDeactivated: onDeactivatedHandler,
        onBeforeAssetChanged: onBeforeAssetChangedHandler,
        onAssetChanged: onAssetChangedHandler,
        onChildAssetSelected: onChildAssetSelectedHandler,
    };

    function createComponent(props?: IAssetPreviewProps): ReactWrapper<IAssetPreviewProps, IAssetPreviewState> {
        props = props || defaultProps;
        return mount(<AssetPreview {...props} />);
    }

    beforeEach(() => {
        onLoadedHandler.mockClear();
        onErrorHandler.mockClear();
        onActivatedHandler.mockClear();
        onDeactivatedHandler.mockClear();
        onBeforeAssetChangedHandler.mockClear();
        onAssetChangedHandler.mockClear();
        onChildAssetSelectedHandler.mockClear();
    });

    it("renders an image asset when asset type is image", () => {
        wrapper = createComponent();
        const imageProps = wrapper.find(ImageAsset).props();

        expect(wrapper.find(ImageAsset).exists()).toBe(true);
        expect(imageProps.onActivated).toBe(onActivatedHandler);
        expect(imageProps.onDeactivated).toBe(onDeactivatedHandler);

    });

    it("renders a video asset when asset type is video", () => {
        const props: IAssetPreviewProps = {
            ...defaultProps,
            asset: MockFactory.createVideoTestAsset("test-video-asset"),
        };
        wrapper = createComponent(props);
        const videoProps = wrapper.find(VideoAsset).props();

        expect(wrapper.find(VideoAsset).exists()).toBe(true);
        expect(videoProps.controlsEnabled).toBe(defaultProps.controlsEnabled);
        expect(videoProps.onActivated).toBe(onActivatedHandler);
        expect(videoProps.onDeactivated).toBe(onDeactivatedHandler);
        expect(videoProps.onBeforeAssetChanged).toBe(onBeforeAssetChangedHandler);
    });

    it("renders a tfrecord asset when asset type is tfrecord", () => {
        const props: IAssetPreviewProps = {
            ...defaultProps,
            asset: MockFactory.createTestAsset("test-record-asset",
                AssetState.Visited,
                dataUri,
                AssetType.TFRecord),
        };
        wrapper = createComponent(props);
        expect(wrapper.find(TFRecordAsset).exists()).toBe(true);
        expect(wrapper.instance().state).toMatchObject({ hasError: false });
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

    it("renders asset error when there is an error loading an asset", () => {
        wrapper = createComponent();
        const errorEvent = new Event("error");

        wrapper.find(ImageAsset).props().onError(errorEvent as any);
        wrapper.update();

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

    it("raises asset error handler when an image asset fails to load successfully", () => {
        wrapper = createComponent();
        const errorEvent = new Event("error");
        wrapper.find(ImageAsset).props().onError(errorEvent as any);

        expect(wrapper.state().hasError).toBe(true);
        expect(wrapper.state().loaded).toBe(true);
        expect(onErrorHandler).toBeCalledWith(errorEvent);
    });

    it("raises asset error handler when a video asset fails to load successfully", () => {
        const props: IAssetPreviewProps = {
            ...defaultProps,
            asset: MockFactory.createVideoTestAsset("test-video-asset"),
        };
        wrapper = createComponent(props);
        const errorEvent = new Event("error");
        wrapper.find(VideoAsset).props().onError(errorEvent as any);

        expect(wrapper.state().hasError).toBe(true);
        expect(wrapper.state().loaded).toBe(true);
        expect(onErrorHandler).toBeCalledWith(errorEvent);
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

    it("raises onBeforeAssetChanged during asset transitions", () => {
        const videoAsset = MockFactory.createVideoTestAsset("test-video-asset");
        const props: IAssetPreviewProps = {
            ...defaultProps,
            asset: videoAsset,
        };
        wrapper = createComponent(props);
        wrapper.find(VideoAsset).props().onBeforeAssetChanged();

        expect(onBeforeAssetChangedHandler).toBeCalled();
    });

    it("blocks onChildAssetSelected", () => {
        const videoAsset = MockFactory.createVideoTestAsset("test-video-asset");
        const childAsset = MockFactory.createChildVideoAsset(videoAsset, 2);
        onBeforeAssetChangedHandler.mockImplementationOnce(() => false);

        const props: IAssetPreviewProps = {
            ...defaultProps,
            asset: videoAsset,
        };
        wrapper = createComponent(props);
        wrapper.find(VideoAsset).props().onChildAssetSelected(childAsset);

        expect(onBeforeAssetChangedHandler).toBeCalled();
        expect(onChildAssetSelectedHandler).not.toBeCalled();
        expect(onAssetChangedHandler).not.toBeCalled();
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

    it("updates loaded/error flags when asset changes", () => {
        wrapper = createComponent();
        wrapper.find(ImageAsset).props().onLoaded(document.createElement("img"));

        expect(wrapper.state()).toEqual({
            loaded: true,
            hasError: false,
        });

        wrapper.setProps({
            asset: MockFactory.createTestAsset("AnotherImageAsset"),
        });

        expect(wrapper.state()).toEqual({
            loaded: false,
            hasError: false,
        });
    });
});
