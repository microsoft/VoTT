import { mount, ReactWrapper } from "enzyme";
import React from "react";
import { Point2D } from "vott-ct/lib/js/CanvasTools/Core/Point2D";
import { RegionData, RegionDataType } from "vott-ct/lib/js/CanvasTools/Core/RegionData";
import { SelectionMode } from "vott-ct/lib/js/CanvasTools/Selection/AreaSelector";
import { RegionType } from "vott-react";
import * as packageJson from "../../../../../package.json";
import MockFactory from "../../../../common/mockFactory";
import { EditorMode, IAssetMetadata, IRegion } from "../../../../models/applicationState";
import { AssetPreview, IAssetPreviewProps } from "../../common/assetPreview/assetPreview";
import Canvas, { ICanvasProps, ICanvasState } from "./canvas";
import CanvasHelpers from "./canvasHelpers";

jest.mock("vott-ct/lib/js/CanvasTools/CanvasTools.Editor");
import { Editor } from "vott-ct/lib/js/CanvasTools/CanvasTools.Editor";

jest.mock("vott-ct/lib/js/CanvasTools/Region/RegionsManager");
import { RegionsManager } from "vott-ct/lib/js/CanvasTools/Region/RegionsManager";

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

    const copiedRegion = MockFactory.createTestRegion("copiedRegion");

    beforeAll(() => {
        const editorMock = Editor as any;
        editorMock.prototype.addContentSource = jest.fn(() => Promise.resolve());
        editorMock.prototype.scaleRegionToSourceSize = jest.fn((regionData: any) => regionData);
        editorMock.prototype.RM = new RegionsManager(null, null);
        editorMock.prototype.AS = { setSelectionMode: jest.fn() };

        const clipboard = (navigator as any).clipboard;
        if (!(clipboard && clipboard.writeText)) {
            (navigator as any).clipboard = {
                writeText: jest.fn(() => Promise.resolve()),
                readText: jest.fn(() => Promise.resolve(JSON.stringify([copiedRegion]))),
            };
        }
    });

    it("renders correctly from default state", () => {
        const wrapper = createComponent();
        const canvas = wrapper.instance();

        expect(wrapper.find(".canvas-enabled").exists()).toBe(true);
        expect(wrapper.state()).toEqual({
            contentSource: null,
            selectedRegions: [],
            currentAsset: canvas.props.selectedAsset,
        });
    });

    it("regions are cleared and reset when selected asset changes", () => {
        const wrapper = createComponent();
        const rmMock = RegionsManager as any;
        rmMock.prototype.deleteAllRegions.mockClear();

        const assetMetadata = MockFactory.createTestAssetMetadata(MockFactory.createTestAsset("new-asset"));
        assetMetadata.regions.push(MockFactory.createTestRegion());
        assetMetadata.regions.push(MockFactory.createTestRegion());

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

        const newRegionData = MockFactory.createTestRegionData();
        const canvas = wrapper.instance();
        const original: IAssetMetadata = {
            asset: { ...canvas.props.selectedAsset.asset },
            regions: [...canvas.props.selectedAsset.regions],
            version: packageJson.version,
        };

        canvas.editor.onSelectionEnd(newRegionData);
        const expectedRegion = CanvasHelpers.fromRegionData(newRegionData, RegionType.Rectangle);

        expect(wrapper.instance().state.selectedRegions).toMatchObject([{ ...expectedRegion, id: expect.any(String) }]);
        expect(wrapper.state().currentAsset.regions).toMatchObject([
            ...original.regions,
            { ...expectedRegion, id: expect.any(String) },
        ]);
    });

    it("canvas updates regions when a new asset is loaded", async () => {
        const wrapper = createComponent();

        const assetMetadata = MockFactory.createTestAssetMetadata(MockFactory.createTestAsset("new-asset"));
        assetMetadata.regions.push(MockFactory.createTestRegion());
        assetMetadata.regions.push(MockFactory.createTestRegion());

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
        const original: IAssetMetadata = {
            asset: { ...canvas.props.selectedAsset.asset },
            regions: [...canvas.props.selectedAsset.regions],
            version: packageJson.version,
        };

        const movedRegionData = MockFactory.createTestRegionData();
        canvas.editor.onRegionMoveEnd("test1", movedRegionData);

        expect(onAssetMetadataChanged).toBeCalledWith({
            ...original,
            regions: original.regions.map((r) => {
                if (r.id === "test1") {
                    return {
                        ...r,
                        points: movedRegionData.points,
                        boundingBox: {
                            height: movedRegionData.height,
                            width: movedRegionData.width,
                            left: movedRegionData.x,
                            top: movedRegionData.y,
                        },
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

        const canvas = wrapper.instance();
        const original: IAssetMetadata = {
            asset: { ...canvas.props.selectedAsset.asset },
            regions: [...canvas.props.selectedAsset.regions],
            version: packageJson.version,
        };

        expect(wrapper.state().currentAsset.regions.length).toEqual(original.regions.length);

        canvas.editor.onRegionDelete("test1");

        expect(wrapper.state().currentAsset.regions.length).toEqual(original.regions.length - 1);
        expect(onAssetMetadataChanged).toBeCalledWith({
            ...original,
            regions: original.regions.filter((r) => r.id !== "test1"),
        });
        expect(wrapper.instance().state.selectedRegions.length).toEqual(0);
    });

    it("onRegionSelected adds region to list of selected regions on asset", () => {
        const wrapper = createComponent();
        const canvas = wrapper.instance();
        const original: IAssetMetadata = {
            asset: { ...canvas.props.selectedAsset.asset },
            regions: [...canvas.props.selectedAsset.regions],
            version: packageJson.version,
        };
        expect(wrapper.state().currentAsset.regions.length).toEqual(original.regions.length);

        canvas.editor.onRegionSelected("test1", false);
        expect(wrapper.state().selectedRegions.length).toEqual(1);
        expect(wrapper.state().selectedRegions).toMatchObject([
            original.regions.find((region) => region.id === "test1"),
        ]);

        canvas.editor.onRegionSelected("test2", true);
        expect(wrapper.state().selectedRegions.length).toEqual(2);
        expect(wrapper.state().selectedRegions).toMatchObject([
            original.regions.find((region) => region.id === "test1"),
            original.regions.find((region) => region.id === "test2"),
        ]);
    });

    it("onRegionSelected with invalid id throws error", () => {
        const wrapper = createComponent();
        const canvas = wrapper.instance();
        const original = { ...canvas.props.selectedAsset };

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

        const expected = cloneWithUpdatedRegionTags(wrapper.prop("selectedAsset"), "test1", [newTag]);

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

        const expected = cloneWithUpdatedRegionTags(wrapper.prop("selectedAsset"), "test1", [newTag]);

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
        const lockedTags = ["tag4"];

        wrapper.setProps({
            onAssetMetadataChanged,
            lockedTags,
        });
        const canvas = wrapper.instance();

        canvas.editor.onRegionSelected("test1", false);
        const expectedTags = ["tag4"];
        expect(wrapper.state().currentAsset.regions[0].tags).toEqual(expectedTags);
        expect(onAssetMetadataChanged).toBeCalledWith(cloneWithUpdatedRegionTags(original, "test1", expectedTags));

        wrapper.setProps({
            lockedTags: [],
        });

        canvas.applyTag("tag4");
        expect(onAssetMetadataChanged).toBeCalledWith(cloneWithUpdatedRegionTags(original, "test1", []));
        expect(wrapper.state().currentAsset.regions[0].tags).toEqual([]);
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

        const expected: IAssetMetadata = cloneWithUpdatedRegionTags(wrapper.prop("selectedAsset"), "test1", lockedTags);
        expect(wrapper.state().currentAsset.regions[0].tags).toEqual(lockedTags);
        expect(onAssetMetadataChanged).toBeCalledWith(expected);
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
        const canvas = wrapper.instance();

        const newRegionData = MockFactory.createTestRegionData();
        const newRegion = CanvasHelpers.fromRegionData(newRegionData, RegionType.Rectangle);

        wrapper.setProps({
            onAssetMetadataChanged,
            lockedTags,
        });

        canvas.editor.onSelectionEnd(newRegionData);

        const expected: IRegion = {
            ...newRegion,
            id: expect.any(String),
            tags: lockedTags,
        };

        expect(wrapper.instance().state.selectedRegions).toMatchObject([expected]);
    });

    it("Copies currently selected regions to clipboard", () => {
        const wrapper = createComponent().find(Canvas);
        const canvas = wrapper.instance() as Canvas;
        canvas.editor.onRegionSelected("test1", true);

        const region1 = wrapper.state().currentAsset.regions.find((r) => r.id === "test1");

        canvas.copyRegions();

        MockFactory.flushUi();

        expect((navigator as any).clipboard.writeText).toBeCalledWith(JSON.stringify([region1]));
    });

    it("Pastes regions to canvas from clipboard", async () => {
        const cProps: ICanvasProps = {
            ...createProps().canvas,
        };
        const wrapper = createComponent({
            ...cProps,
            selectedAsset: {
                ...cProps.selectedAsset,
                regions: [copiedRegion],
            },
        }).find(Canvas);

        const canvas = wrapper.instance() as Canvas;
        canvas.pasteRegions();

        expect((navigator as any).clipboard.readText).toBeCalled();

        const expectedNewRegion: IRegion = {
            ...copiedRegion,
            id: expect.any(String),
            boundingBox: {
              ...copiedRegion.boundingBox,
                left: copiedRegion.boundingBox.left + CanvasHelpers.pasteMargin,
                top: copiedRegion.boundingBox.top + CanvasHelpers.pasteMargin,
            },
            points: copiedRegion.points.map((p) => {
                return {
                    x: p.x + CanvasHelpers.pasteMargin,
                    y: p.y + CanvasHelpers.pasteMargin,
                };
            }),
        };

        await MockFactory.flushUi();

        expect(wrapper.state().currentAsset.regions).toEqual([
            copiedRegion,
            expectedNewRegion,
        ]);
    });

    it("Cuts currently selected regions to clipboard", async () => {
        const wrapper = createComponent().find(Canvas);
        const original: IAssetMetadata = {
            ...wrapper.prop("selectedAsset"),
        };
        const canvas = wrapper.instance() as Canvas;
        canvas.editor.onRegionSelected("test1", true);
        const region1 = wrapper.state().currentAsset.regions.find((r) => r.id === "test1");

        canvas.cutRegions();

        const expectedRegions = [
            ...original.regions.filter((r) => r.id !== "test1"),
        ];

        await MockFactory.flushUi();

        expect(wrapper.state().currentAsset.regions).toMatchObject(expectedRegions);
        expect((navigator as any).clipboard.writeText).toBeCalledWith(JSON.stringify([region1]));
    });

    it("Clears all regions from asset", async () => {
        const wrapper = createComponent().find(Canvas);
        const canvas = wrapper.instance() as Canvas;
        canvas.clearRegions();

        await MockFactory.flushUi();
        expect(wrapper.state().currentAsset.regions).toEqual([]);
    });
});
