import React from "react";
import { ReactWrapper, mount } from "enzyme";
import { Player } from "video-react";
import { IVideoAssetProps, VideoAsset, IVideoPlayerState, IVideoAssetState } from "./videoAsset";
import MockFactory from "../../../../common/mockFactory";
import { CustomVideoPlayerButton } from "../../common/videoPlayer/customVideoPlayerButton";
import { AssetType, AssetState, IAsset } from "../../../../models/applicationState";

describe("Video Asset Component", () => {
    let wrapper: ReactWrapper<IVideoAssetProps, IVideoAssetState> = null;
    let onVideoStateChangeHandler: (state: Readonly<IVideoPlayerState>, prev: Readonly<IVideoPlayerState>) => void;
    let videoPlayerState: IVideoPlayerState = {
        currentTime: 0,
        duration: 10,
        paused: false,
        readyState: 1,
        seeking: false,
    };
    const videoPlayerMock = Player as jest.Mocked<typeof Player>;
    const onLoadedHandler = jest.fn();
    const onActivatedHandler = jest.fn();
    const onDeactivatedHandler = jest.fn();
    const onChildSelectedHandler = jest.fn();
    const onBeforeAssetChangedHandler = jest.fn(() => true);
    const defaultProps: IVideoAssetProps = {
        asset: MockFactory.createVideoTestAsset("test-video"),
        autoPlay: true,
        controlsEnabled: true,
        timestamp: 0,
        onLoaded: onLoadedHandler,
        onActivated: onActivatedHandler,
        onDeactivated: onDeactivatedHandler,
        onChildAssetSelected: onChildSelectedHandler,
        onBeforeAssetChanged: onBeforeAssetChangedHandler,
        additionalSettings: { videoSettings: { frameExtractionRate: 1 } },
    };

    beforeEach(() => {
        videoPlayerMock.prototype.getState = jest.fn(() => ({ player: videoPlayerState }));
        videoPlayerMock.prototype.subscribeToStateChange = jest.fn((handler) => onVideoStateChangeHandler = handler);
        videoPlayerMock.prototype.pause = jest.fn();
        videoPlayerMock.prototype.seek = jest.fn((timestamp) => {
            mockPaused(timestamp);
        });

        onLoadedHandler.mockClear();
        onActivatedHandler.mockClear();
        onDeactivatedHandler.mockClear();
        onChildSelectedHandler.mockClear();
        onBeforeAssetChangedHandler.mockClear();
    });

    function createComponent(props?: IVideoAssetProps): ReactWrapper<IVideoAssetProps, IVideoAssetState> {
        props = props || defaultProps;

        return mount(<VideoAsset {...props} />);
    }

    it("renders correctly", () => {
        wrapper = createComponent();

        expect(wrapper.find(Player).exists()).toBe(true);
        expect(wrapper.find(CustomVideoPlayerButton).length).toEqual(4);
        expect(wrapper.find(".video-react-control-bar-disabled").exists()).toBe(false);
    });

    it("renders disabled overlay over controls when controls are not enabled", () => {
        const testProps: IVideoAssetProps = {
            ...defaultProps,
            controlsEnabled: false,
        };

        wrapper = createComponent(testProps);
        expect(wrapper.find(".video-react-control-bar-disabled").exists()).toBe(true);
    });

    it("resets loaded state when asset changes", () => {
        wrapper = createComponent();
        mockLoaded();

        const newAsset = MockFactory.createVideoTestAsset("new-video-asset");
        wrapper.setProps({ asset: newAsset });
        expect(wrapper.state().loaded).toBe(false);
    });

    it("does not subscribe to state change callback when autoPlay is false", () => {
        const testProps: IVideoAssetProps = {
            ...defaultProps,
            autoPlay: false,
        };
        wrapper = createComponent(testProps);
        mockLoaded();

        const newAsset = MockFactory.createVideoTestAsset("new-video-asset");
        wrapper.setProps({ asset: newAsset });
        expect(videoPlayerMock.prototype.subscribeToStateChange).not.toBeCalled();
    });

    it("seeks the video player to the specified timestamp when timestamp changes", () => {
        const expectedTime = 10.2;
        wrapper = createComponent();
        mockLoaded();

        wrapper.setProps({ timestamp: expectedTime });
        expect(videoPlayerMock.prototype.seek).toBeCalledWith(expectedTime);
    });

    it("seeks the video player locked to the keyframe rate", () => {
        const invalidTime = 10.2;
        const expectedTime = 10;
        wrapper = createComponent();
        mockLoaded();
        wrapper.setProps({ timestamp: invalidTime });
        mockSeek(invalidTime);

        expect(videoPlayerMock.prototype.seek).toBeCalledWith(expectedTime);
    });

    it("checks to see video player rounds correctly when locked to the keyframe rate", () => {
        const invalidTime = 6.765;
        const expectedTime = 7;
        wrapper = createComponent();
        mockLoaded();
        wrapper.setProps({ timestamp: invalidTime });
        mockSeek(invalidTime);

        expect(videoPlayerMock.prototype.seek).toBeCalledWith(expectedTime);
    });

    describe("moving between frames", () => {
        let childAssets: IAsset[];

        beforeEach(() => {
            childAssets = MockFactory.createChildVideoAssets(defaultProps.asset);
        });

        function setupMoveFrameTest(currentAsset: IAsset) {
            videoPlayerMock.prototype.getState = jest.fn(() => {
                return {
                    player: {
                        currentTime: currentAsset.timestamp,
                    },
                };
            });

            const props: IVideoAssetProps = {
                ...defaultProps,
                childAssets,
                timestamp: currentAsset.timestamp,
            };

            wrapper = createComponent(props);
            mockLoaded();
        }

        it("moves to the next tagged frame when clicking the next button", () => {
            const currentAsset = childAssets[0];
            const expectedAsset = {
                ...childAssets[1],
                state: AssetState.NotVisited,
            };

            setupMoveFrameTest(currentAsset);
            wrapper.find(CustomVideoPlayerButton).at(3).simulate("click");

            expect(videoPlayerMock.prototype.pause).toBeCalled();
            expect(videoPlayerMock.prototype.seek).toBeCalledWith(expectedAsset.timestamp);
            expect(onChildSelectedHandler).toBeCalledWith(expectedAsset);
        });

        it("blocks moving to next tagged frame when navigation is cancelled", () => {
            const currentAsset = childAssets[0];

            onBeforeAssetChangedHandler.mockImplementationOnce(() => false);

            setupMoveFrameTest(currentAsset);
            wrapper.find(CustomVideoPlayerButton).at(3).simulate("click");

            expect(videoPlayerMock.prototype.pause).not.toBeCalled();
            expect(videoPlayerMock.prototype.seek).not.toBeCalled();
            expect(onChildSelectedHandler).not.toBeCalled();
        });

        it("moves to the previous tagged frame when clicking the back button", () => {
            const currentAsset = childAssets[4];
            const expectedAsset = {
                ...childAssets[3],
                state: AssetState.NotVisited,
            };

            setupMoveFrameTest(currentAsset);

            wrapper.find(CustomVideoPlayerButton).at(3).simulate("click");
            wrapper.find(CustomVideoPlayerButton).at(2).simulate("click");

            expect(videoPlayerMock.prototype.pause).toBeCalled();
            expect(videoPlayerMock.prototype.seek).toBeCalledWith(expectedAsset.timestamp);
            expect(onChildSelectedHandler).toBeCalledWith(expectedAsset);
        });

        it("blockings moving to the previous tagged frame when navigation is cancelled", () => {
            const currentAsset = childAssets[4];
            onBeforeAssetChangedHandler.mockImplementationOnce(() => false);
            setupMoveFrameTest(currentAsset);

            wrapper.find(CustomVideoPlayerButton).at(3).simulate("click");

            expect(videoPlayerMock.prototype.pause).not.toBeCalled();
            expect(videoPlayerMock.prototype.seek).not.toBeCalled();
            expect(onChildSelectedHandler).not.toBeCalled();
        });

        it("moves to the next expected frame when clicking the next button", () => {
            const currentAsset = childAssets[0];
            setupMoveFrameTest(currentAsset);

            wrapper.find(CustomVideoPlayerButton).at(3).simulate("click");
            wrapper.find(CustomVideoPlayerButton).at(1).simulate("click");

            expect(videoPlayerMock.prototype.pause).toBeCalled();
            expect(videoPlayerMock.prototype.seek).toBeCalledWith(
                currentAsset.timestamp + (1 / defaultProps.additionalSettings.videoSettings.frameExtractionRate));
        });

        it("blocks moving to the next expected frame when navigation is cancelled", () => {
            const currentAsset = childAssets[0];
            onBeforeAssetChangedHandler.mockImplementationOnce(() => false);
            setupMoveFrameTest(currentAsset);

            wrapper.find(CustomVideoPlayerButton).at(3).simulate("click");

            expect(videoPlayerMock.prototype.pause).not.toBeCalled();
            expect(videoPlayerMock.prototype.seek).not.toBeCalled();
        });

        it("moves to the previous expected frame when clicking the back button", () => {
            const currentAsset = childAssets[4];
            setupMoveFrameTest(currentAsset);

            wrapper.find(CustomVideoPlayerButton).at(0).simulate("click");

            expect(videoPlayerMock.prototype.pause).toBeCalled();
            expect(videoPlayerMock.prototype.seek).toBeCalledWith(
                currentAsset.timestamp - (1 / defaultProps.additionalSettings.videoSettings.frameExtractionRate));
        });

        it("blocks moving to the previous expected frame navigation is cancelled", () => {
            const currentAsset = childAssets[4];
            onBeforeAssetChangedHandler.mockImplementationOnce(() => false);
            setupMoveFrameTest(currentAsset);

            wrapper.find(CustomVideoPlayerButton).at(0).simulate("click");

            expect(videoPlayerMock.prototype.pause).not.toBeCalled();
            expect(videoPlayerMock.prototype.seek).not.toBeCalled();
        });
    });

    it("raises the onLoad and activated handlers when the video has been loaded", () => {
        wrapper = createComponent();
        mockLoaded();

        expect(onLoadedHandler).toBeCalledWith(expect.any(HTMLVideoElement));
        expect(onActivatedHandler).toBeCalledWith(expect.any(HTMLVideoElement));
        expect(wrapper.state().loaded).toBe(true);
    });

    it("raises the child asset selected and deactivated handlers when the video is paused", () => {
        const expectedTime = 6;
        wrapper = createComponent();
        mockLoaded();
        mockPaused(expectedTime);

        expect(onDeactivatedHandler).toBeCalledWith(expect.any(HTMLVideoElement));
        expect(onChildSelectedHandler).toBeCalledWith(expect.objectContaining({
            type: AssetType.VideoFrame,
            path: `${defaultProps.asset.path}#t=${expectedTime}`,
            timestamp: expectedTime,
            parent: defaultProps.asset,
        }));
    });

    it("raises the activated handler when the video resumes", () => {
        wrapper = createComponent();
        mockLoaded();
        mockPaused(4.0);

        onLoadedHandler.mockReset();
        onDeactivatedHandler.mockReset();

        mockResume();

        expect(onLoadedHandler).not.toBeCalled();
        expect(onDeactivatedHandler).not.toBeCalled();
        expect(onActivatedHandler).toBeCalledWith(expect.any(HTMLVideoElement));
    });

    it("renders the custom video player buttons when autoPlay is enabled", () => {
        const props = { ...defaultProps, autoPlay: true };
        wrapper = createComponent(props);

        expect(wrapper.find(CustomVideoPlayerButton)).toHaveLength(4);
    });

    it("does not render the custom video player buttons when autoPlay is disabled", () => {
        const props = { ...defaultProps, autoPlay: false };
        wrapper = createComponent(props);

        expect(wrapper.find(CustomVideoPlayerButton)).toHaveLength(0);
    });

    function mockLoaded() {
        const state: IVideoPlayerState = {
            readyState: 4,
            paused: false,
            currentTime: 0,
            seeking: false,
            duration: 10,
        };

        const prev: IVideoPlayerState = {
            readyState: 1,
            paused: false,
            currentTime: 0,
            seeking: false,
            duration: 10,
        };

        videoPlayerState = state;
        onVideoStateChangeHandler(state, prev);
    }

    function mockPaused(currentTime: number) {
        const state: IVideoPlayerState = {
            readyState: 4,
            paused: true,
            currentTime,
            seeking: false,
            duration: 10,
        };

        const prev: IVideoPlayerState = {
            readyState: 4,
            paused: false,
            currentTime: 2.0,
            seeking: true,
            duration: 10,
        };

        videoPlayerState = state;
        onVideoStateChangeHandler(state, prev);
    }

    function mockResume() {
        const state: IVideoPlayerState = {
            readyState: 4,
            paused: false,
            currentTime: 0,
            seeking: false,
            duration: 10,
        };

        const prev: IVideoPlayerState = {
            readyState: 4,
            paused: true,
            currentTime: 0,
            seeking: false,
            duration: 10,
        };

        videoPlayerState = state;
        onVideoStateChangeHandler(state, prev);
    }

    function mockSeek(currentTime: number) {
        const state: IVideoPlayerState = {
            readyState: 4,
            paused: true,
            currentTime,
            seeking: false,
            duration: 10,
        };

        const prev: IVideoPlayerState = {
            readyState: 4,
            paused: true,
            currentTime: 0,
            seeking: true,
            duration: 10,
        };

        onVideoStateChangeHandler(state, prev);
    }
});
