import React from "react";
import { ReactWrapper, mount } from "enzyme";
import Canvas, { ICanvasProps, ICanvasState } from "./canvas";
import { RegionData, RegionDataType } from "vott-ct/lib/js/CanvasTools/Core/RegionData";
import { Point2D } from "vott-ct/lib/js/CanvasTools/Core/Point2D";
import { AssetPreview, IAssetPreviewProps } from "../../common/assetPreview/assetPreview";
import MockFactory from "../../../../common/mockFactory";
import { EditorMode, IAssetMetadata } from "../../../../models/applicationState";

jest.mock("vott-ct/lib/js/CanvasTools/CanvasTools.Editor");
import { Editor } from "vott-ct/lib/js/CanvasTools/CanvasTools.Editor";

jest.mock("vott-ct/lib/js/CanvasTools/Region/RegionsManager");
import { RegionsManager } from "vott-ct/lib/js/CanvasTools/Region/RegionsManager";
import { SelectionMode, AreaSelector } from "vott-ct/lib/js/CanvasTools/Selection/AreaSelector";
import CanvasHelpers from "./canvasHelpers";
import { IRegion } from "vott-react";

describe("Editor Canvas", () => {

    function createTestRegionData() {
        const testRegionData = new RegionData(0, 0, 100, 100,
            [new Point2D(0, 0), new Point2D(1, 0), new Point2D(0, 1), new Point2D(1, 1)], RegionDataType.Rect);
        return testRegionData;
    }

    function createComponent(canvasProps?: ICanvasProps, assetPreviewProps?: IAssetPreviewProps)
        : ReactWrapper<ICanvasProps, ICanvasState, Canvas> {
        const props = createProps();
        const cProps = canvasProps || props.canvas;
        const aProps = assetPreviewProps || props.assetPreview;
        return mount(
            <Canvas {...cProps}>
                <AssetPreview {...aProps} />
            </Canvas>,
        );
    }
    function getAssetMetadata() {
        return MockFactory.createTestAssetMetadata(
            MockFactory.createTestAsset(), MockFactory.createTestRegions());
    }

    function createProps() {

        const canvasProps: ICanvasProps = {
            selectedAsset: getAssetMetadata(),
            onAssetMetadataChanged: jest.fn(),
            editorMode: EditorMode.Rectangle,
            selectionMode: SelectionMode.RECT,
            project: MockFactory.createTestProject(),
            lockedTags: [],
        };

        const assetPreviewProps: IAssetPreviewProps = {
            asset: getAssetMetadata().asset,
        };

        return {
            canvas: canvasProps,
            assetPreview: assetPreviewProps,
        };
    }

    beforeAll(() => {
        const editorMock = Editor as any;
        editorMock.prototype.addContentSource = jest.fn(() => Promise.resolve());
        editorMock.prototype.scaleRegionToSourceSize = jest.fn((regionData: any) => regionData);
        editorMock.prototype.RM = new RegionsManager(null, null);
        editorMock.prototype.AS = { setSelectionMode: jest.fn() };
    });

    it("renders correctly from default state", () => {
        const wrapper = createComponent();

        expect(wrapper.find(".canvas-enabled").exists()).toBe(true);
        expect(wrapper.state()).toEqual({
            contentSource: null,
            selectedRegions: [],
            currentAsset: getAssetMetadata(),
        });
    });

    it("regions are cleared and reset when selected asset changes", () => {
        const wrapper = createComponent();
        const rmMock = RegionsManager as any;
        rmMock.prototype.deleteAllRegions.mockClear();

        const assetMetadata = MockFactory.createTestAssetMetadata(MockFactory.createTestAsset("new-asset"));
        assetMetadata.regions.push(MockFactory.createMockRegion());
        assetMetadata.regions.push(MockFactory.createMockRegion());

        wrapper.setProps({ selectedAsset: assetMetadata });
        expect(wrapper.instance().editor.RM.deleteAllRegions).toBeCalled();
        expect(wrapper.state().selectedRegions).toEqual([]);
    });

    it("canvas is updated when asset loads", () => {
        const wrapper = createComponent();
        wrapper.find(AssetPreview).props().onLoaded(document.createElement("img"));

        expect(wrapper.instance().editor.addContentSource).toBeCalledWith(expect.any(HTMLImageElement));
        expect(wrapper.state().contentSource).toEqual(expect.any(HTMLImageElement));
    });

    it("canvas content source is updated when asset is deactivated", () => {
        const wrapper = createComponent();
        const contentSource = document.createElement("img");
        wrapper.setState({ contentSource });
        wrapper.find(AssetPreview).props().onDeactivated(document.createElement("img"));

        expect(wrapper.instance().editor.addContentSource).toBeCalledWith(expect.any(HTMLImageElement));
    });

    it("content source is updated on an interval", () => {
        window.setInterval = jest.fn();

        const wrapper = createComponent();
        wrapper.find(AssetPreview).props().onActivated(document.createElement("img"));
        expect(window.setInterval).toBeCalled();
    });

    it("onSelectionEnd adds region to asset and selects it", () => {
        const wrapper = createComponent();
        const onAssetMetadataChanged = jest.fn();
        wrapper.setProps({ onAssetMetadataChanged });

        const testCommit = createTestRegionData();
        const canvas = wrapper.instance();
        canvas.editor.onSelectionEnd(testCommit);

        const testRegion = MockFactory.createTestRegion();

        const originalAssetMetadata = getAssetMetadata();

        expect(wrapper.instance().state.selectedRegions).toMatchObject([testRegion]);
        expect(wrapper.state().currentAsset.regions).toMatchObject([
            ...originalAssetMetadata.regions,
            testRegion,
        ]);
    });

    it("canvas updates regions when a new asset is loaded", async () => {
        const wrapper = createComponent();

        const assetMetadata = MockFactory.createTestAssetMetadata(MockFactory.createTestAsset("new-asset"));
        assetMetadata.regions.push(MockFactory.createMockRegion());
        assetMetadata.regions.push(MockFactory.createMockRegion());

        // Clear out mock counts
        (wrapper.instance().editor.RM.addRegion as any).mockClear();

        wrapper.setProps({ selectedAsset: assetMetadata });
        wrapper.find(AssetPreview).props().onLoaded(document.createElement("img"));

        await MockFactory.flushUi();

        expect(wrapper.instance().editor.RM.addRegion).toBeCalledTimes(assetMetadata.regions.length);
        expect(wrapper.state().selectedRegions).toEqual([assetMetadata.regions[assetMetadata.regions.length - 1]]);
    });

    it("onRegionMove edits region info in asset", () => {
        const wrapper = createComponent();
        const onAssetMetadataChanged = jest.fn();
        wrapper.setProps({ onAssetMetadataChanged });

        const canvas = wrapper.instance();

        const regionData = createTestRegionData();
        canvas.editor.onRegionMoveEnd("test1", regionData);

        const originalAssetMetadata = getAssetMetadata();

        expect(onAssetMetadataChanged).toBeCalledWith({
            ...originalAssetMetadata,
            regions: originalAssetMetadata.regions.map((r) => {
                if (r.id === "test1") {
                    return {
                        ...r,
                        points: regionData.points,
                    };
                }
                return r;
            }),
        });
    });

    it("onRegionDelete removes region from asset and clears selectedRegions", () => {
        const wrapper = createComponent();
        const onAssetMetadataChanged = jest.fn();
        wrapper.setProps({ onAssetMetadataChanged });

        const originalAssetMetadata = getAssetMetadata();
        expect(wrapper.state().currentAsset.regions.length).toEqual(originalAssetMetadata.regions.length);

        const canvas = wrapper.instance();
        canvas.editor.onRegionDelete("test1");

        expect(wrapper.state().currentAsset.regions.length).toEqual(originalAssetMetadata.regions.length - 1);
        expect(onAssetMetadataChanged).toBeCalledWith({
            ...originalAssetMetadata,
            regions: originalAssetMetadata.regions.filter((r) => r.id !== "test1"),
        });
        expect(wrapper.instance().state.selectedRegions.length).toEqual(0);
    });

    it("onRegionSelected adds region to list of selected regions on asset", () => {
        const wrapper = createComponent();
        const canvas = wrapper.instance();

        const originalAssetMetadata = getAssetMetadata();

        expect(wrapper.state().currentAsset.regions.length).toEqual(originalAssetMetadata.regions.length);

        canvas.editor.onRegionSelected("test1", false);
        expect(wrapper.state().selectedRegions.length).toEqual(1);
        expect(wrapper.state().selectedRegions)
            .toMatchObject([MockFactory.createTestRegion("test1")]);

        canvas.editor.onRegionSelected("test2", true);
        expect(wrapper.state().selectedRegions.length).toEqual(2);
        expect(wrapper.state().selectedRegions)
            .toMatchObject([MockFactory.createTestRegion("test1"), MockFactory.createTestRegion("test2")]);
    });

    it("onRegionSelected with invalid id throws error", () => {
        const wrapper = createComponent();
        const canvas = wrapper.instance();

        expect(() => {
            canvas.editor.onRegionSelected("fakeRegion", false);
        }).toThrowError("Couldn't find region with id fakeRegion");
    });

    function cloneWithUpdatedRegionTags(original: IAssetMetadata, regionId: string, tags: string[]) {
        return {
            ...original,
            regions: original.regions.map((r) => {
                if (r.id === regionId) {
                    return {
                        ...r,
                        tags,
                    };
                }
                return r;
            }),
        };
    }

    it("Applies single tag to selected region", () => {
        const wrapper = createComponent();
        const onAssetMetadataChanged = jest.fn();
        wrapper.setProps({ onAssetMetadataChanged });
        const canvas = wrapper.instance();

        canvas.editor.onRegionSelected("test1", null);

        const newTag = "newTag";
        canvas.applyTag(newTag);

        const original = getAssetMetadata();
        const expected = cloneWithUpdatedRegionTags(original, "test1", [newTag]);

        expect(onAssetMetadataChanged).toBeCalledWith(expected);
        expect(wrapper.state().currentAsset.regions[0].tags).toEqual([newTag]);
    });

    it("Adds new locked tag to selected region", () => {
        const wrapper = createComponent();
        const onAssetMetadataChanged = jest.fn();
        const newTag = "newTag";
        wrapper.setProps({
            onAssetMetadataChanged,
            lockedTags: [newTag],
        });
        const canvas = wrapper.instance();

        canvas.editor.onRegionSelected("test1", false);

        canvas.applyTag(newTag);

        const original = getAssetMetadata();
        const expected = cloneWithUpdatedRegionTags(original, "test1", [newTag]);

        expect(onAssetMetadataChanged).toBeCalledWith(expected);
        expect(wrapper.state().currentAsset.regions[0].tags).toEqual([newTag]);
    });

    it("Removes old locked tag from selected region", () => {
        const original = cloneWithUpdatedRegionTags(getAssetMetadata(), "test1", ["tag4"]);
        const canvasProps: ICanvasProps = {
            ...createProps().canvas,
            selectedAsset: original,
        };
        const wrapper = createComponent(canvasProps);
        const onAssetMetadataChanged = jest.fn();
        const lockedTags = ["tag1", "tag2", "tag3"];

        wrapper.setProps({
            onAssetMetadataChanged,
            lockedTags,
        });
        const canvas = wrapper.instance();

        canvas.editor.onRegionSelected("test1", false);
        const expectedTags = ["tag4", "tag1", "tag2", "tag3"];
        expect(wrapper.state().currentAsset.regions[0].tags).toEqual(expectedTags);
        expect(onAssetMetadataChanged).toBeCalledWith(cloneWithUpdatedRegionTags(original, "test1", expectedTags));

        wrapper.setProps({
            lockedTags,
        });

        canvas.applyTag("tag4");
        expect(onAssetMetadataChanged).toBeCalledWith(cloneWithUpdatedRegionTags(original, "test1", lockedTags));
        expect(wrapper.state().currentAsset.regions[0].tags).toEqual(lockedTags);
    });

    it("Applies locked tags to selected region with empty tags", () => {
        const wrapper = createComponent();
        const onAssetMetadataChanged = jest.fn();
        const lockedTags = ["tag1", "tag2", "tag3"];
        wrapper.setProps({
            onAssetMetadataChanged,
            lockedTags,
        });
        const canvas = wrapper.instance();

        canvas.editor.onRegionSelected("test1", null);

        const original = getAssetMetadata();
        const expected: IAssetMetadata = cloneWithUpdatedRegionTags(original, "test1", lockedTags);
        expect(onAssetMetadataChanged).toBeCalledWith(expected);
        expect(wrapper.state().currentAsset.regions[0].tags).toEqual(lockedTags);
    });

    it("Applies locked tags to selected region with existing tags", () => {
        const original = getAssetMetadata();
        const canvasProps: ICanvasProps = {
            ...createProps().canvas,
            selectedAsset: cloneWithUpdatedRegionTags(original, "test1", ["tag4"]),
        };
        const wrapper = createComponent(canvasProps);
        const onAssetMetadataChanged = jest.fn();
        const lockedTags = ["tag1", "tag2", "tag3"];

        wrapper.setProps({
            onAssetMetadataChanged,
            lockedTags,
        });
        const canvas = wrapper.instance();

        canvas.editor.onRegionSelected("test1", null);

        const expectedTags = ["tag4", ...lockedTags];

        const expected: IAssetMetadata = cloneWithUpdatedRegionTags(original, "test1", expectedTags);
        expect(wrapper.state().currentAsset.regions[0].tags).toEqual(expectedTags);
        expect(onAssetMetadataChanged).toBeCalledWith(expected);
    });

    it("Applies locked tags to newly drawn region", () => {
        const wrapper = createComponent();
        const onAssetMetadataChanged = jest.fn();
        const lockedTags = ["tag1", "tag2", "tag3"];
        wrapper.setProps({
            onAssetMetadataChanged,
            lockedTags,
        });
        const canvas = wrapper.instance();

        const testCommit = createTestRegionData();
        canvas.editor.onSelectionEnd(testCommit);

        const expected: IRegion = {
            ...MockFactory.createTestRegion(),
            tags: lockedTags,
        };

        const originalAssetMetadata = getAssetMetadata();

        expect(wrapper.instance().state.selectedRegions).toMatchObject([expected]);
        expect(wrapper.state().currentAsset.regions).toMatchObject([
            ...originalAssetMetadata.regions,
            expected,
        ]);
    });
});
