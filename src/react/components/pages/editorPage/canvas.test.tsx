import React from "react";
import { ReactWrapper, mount } from "enzyme";
import Canvas, { ICanvasProps, ICanvasState } from "./canvas";
import { RegionData, RegionDataType } from "vott-ct/lib/js/CanvasTools/Core/RegionData";
import { Point2D } from "vott-ct/lib/js/CanvasTools/Core/Point2D";
import { AssetPreview, IAssetPreviewProps } from "../../common/assetPreview/assetPreview";
import MockFactory from "../../../../common/mockFactory";
import { EditorMode } from "../../../../models/applicationState";

jest.mock("vott-ct/lib/js/CanvasTools/CanvasTools.Editor");
import { Editor } from "vott-ct/lib/js/CanvasTools/CanvasTools.Editor";

jest.mock("vott-ct/lib/js/CanvasTools/Region/RegionsManager");
import { RegionsManager } from "vott-ct/lib/js/CanvasTools/Region/RegionsManager";
import { SelectionMode } from "vott-ct/lib/js/CanvasTools/Selection/AreaSelector";
import { KeyCodes } from "../../../../common/utils";
import { KeyEventType, KeyboardManager } from "../../common/keyboardManager/keyboardManager";

describe("Editor Canvas", () => {
    let wrapper: ReactWrapper<ICanvasProps, ICanvasState, Canvas> = null;
    const onAssetMetadataChanged = jest.fn();

    function createComponent(canvasProps: ICanvasProps, assetPreviewProps: IAssetPreviewProps,
                             includeKeyboardManager = false)
        : ReactWrapper<ICanvasProps, ICanvasState, Canvas> {
            if (includeKeyboardManager) {
                return mount(
                    <KeyboardManager>
                        <Canvas {...canvasProps}>
                            <AssetPreview {...assetPreviewProps} />
                        </Canvas>
                    </KeyboardManager>,
                );
            } else {
                return mount(
                        <Canvas {...canvasProps}>
                            <AssetPreview {...assetPreviewProps} />
                        </Canvas>,
                );
            }

    }

    function createProps() {
        const assetMetadata = MockFactory.createTestAssetMetadata(MockFactory.createTestAsset("test"));

        const canvasProps: ICanvasProps = {
            selectedAsset: assetMetadata,
            onAssetMetadataChanged,
            editorMode: EditorMode.Rectangle,
            selectionMode: SelectionMode.RECT,
            project: MockFactory.createTestProject(),
            selectedTags: [],
        };

        const assetPreviewProps: IAssetPreviewProps = {
            asset: assetMetadata.asset,
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
        editorMock.prototype.RM = new RegionsManager(null, null, null);
    });

    beforeEach(() => {
        const props = createProps();
        wrapper = createComponent(props.canvas, props.assetPreview);
    });

    it("renders correctly from default state", () => {
        expect(wrapper.find(".canvas-enabled").exists()).toBe(true);
        expect(wrapper.state()).toEqual({
            contentSource: null,
            selectedRegions: [],
            canvasEnabled: true,
            multiSelect: false,
        });

        expect(wrapper.instance().editor.RM.deleteAllRegions).toBeCalled();
    });

    it("regions are cleared and reset when selected asset changes", () => {
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
        wrapper.find(AssetPreview).props().onLoaded(expect.any(HTMLImageElement));

        expect(wrapper.instance().editor.addContentSource).toBeCalledWith(expect.any(HTMLImageElement));
        expect(wrapper.state().contentSource).toEqual(expect.any(HTMLImageElement));
    });

    it("canvas is enabled when an asset is deactivated", () => {
        wrapper.find(AssetPreview).props().onDeactivated(expect.any(HTMLImageElement));

        expect(wrapper.instance().editor.addContentSource).toBeCalledWith(expect.any(HTMLImageElement));
        expect(wrapper.state().canvasEnabled).toEqual(true);
    });

    it("canvas is deactivated when an asset is activated", () => {
        wrapper.find(AssetPreview).props().onActivated(expect.any(HTMLImageElement));
        expect(wrapper.state().canvasEnabled).toEqual(false);
    });

    it("onSelectionEnd adds region to asset and selects it", () => {
        const testCommit = MockFactory.createTestRegionData();
        const canvas = wrapper.instance();
        const testRegion = MockFactory.createTestRegion(expect.any(String));
        canvas.editor.onSelectionEnd(testCommit);

        expect(onAssetMetadataChanged).toBeCalled();
        expect(wrapper.prop("selectedAsset").regions).toMatchObject([testRegion]);
        expect(wrapper.instance().state.selectedRegions).toMatchObject([testRegion]);
    });

    it("canvas updates regions when a new asset is loaded", async () => {
        const assetMetadata = MockFactory.createTestAssetMetadata(MockFactory.createTestAsset("new-asset"));
        assetMetadata.regions.push(MockFactory.createTestRegion());
        assetMetadata.regions.push(MockFactory.createTestRegion());

        // Clear out mock counts
        (wrapper.instance().editor.RM.addRegion as any).mockClear();

        wrapper.setProps({ selectedAsset: assetMetadata });
        wrapper.find(AssetPreview).props().onLoaded(expect.any(HTMLImageElement));

        await MockFactory.flushUi();

        expect(wrapper.instance().editor.RM.addRegion).toBeCalledTimes(assetMetadata.regions.length);
        expect(wrapper.state().selectedRegions).toEqual([assetMetadata.regions[assetMetadata.regions.length - 1]]);
    });

    it("onRegionMove edits region info in asset", () => {
        const canvas = wrapper.instance();
        const testRegion = MockFactory.createTestRegion("test-region");

        testRegion.points = [new Point2D(0, 1), new Point2D(1, 1), new Point2D(0, 2), new Point2D(1, 2)];
        wrapper.prop("selectedAsset").regions.push(testRegion);
        canvas.editor.onRegionMove("test-region", MockFactory.createTestRegionData());

        expect(onAssetMetadataChanged).toBeCalled();
        expect(wrapper.prop("selectedAsset").regions).toMatchObject([MockFactory.createTestRegion("test-region")]);
    });

    it("onRegionDelete removes region from asset and clears selectedRegions", () => {
        const canvas = wrapper.instance();
        const testRegion = MockFactory.createTestRegion("test-region");

        wrapper.prop("selectedAsset").regions.push(testRegion);
        expect(wrapper.prop("selectedAsset").regions.length).toEqual(1);

        canvas.editor.onRegionDelete("test-region");

        expect(onAssetMetadataChanged).toBeCalled();
        expect(wrapper.prop("selectedAsset").regions.length).toEqual(0);
        expect(wrapper.instance().state.selectedRegions.length).toEqual(0);
    });

    it("onRegionSelected adds region to list of selected regions on asset", () => {
        const canvas = wrapper.instance();
        const testRegion1 = MockFactory.createTestRegion("test1");
        const testRegion2 = MockFactory.createTestRegion("test2");

        wrapper.prop("selectedAsset").regions.push(testRegion1);
        wrapper.prop("selectedAsset").regions.push(testRegion2);
        expect(wrapper.prop("selectedAsset").regions.length).toEqual(2);
        canvas.onRegionSelected("test1");
        expect(wrapper.instance().state.selectedRegions.length).toEqual(1);
        expect(wrapper.instance().state.selectedRegions)
            .toMatchObject([testRegion1]);
    });

    it("Shift key sets and unsets multi-select", () => {
        const props = createProps();
        const newWrapper = createComponent(props.canvas, props.assetPreview, true);

        expect(newWrapper.find(Canvas).state().multiSelect).toBe(false);

        window.dispatchEvent(new KeyboardEvent(
            KeyEventType.KeyDown, {
            key: "Shift",
        }));

        expect(newWrapper.find(Canvas).state().multiSelect).toBe(true);

        window.dispatchEvent(new KeyboardEvent(
            KeyEventType.KeyUp, {
            key: "Shift",
        }));

        expect(newWrapper.find(Canvas).state().multiSelect).toBe(false);
    });

    function getPopulatedWrapper() {
        const props = createProps();
        const newWrapper = createComponent(props.canvas, props.assetPreview, true);

        const testRegion1 = MockFactory.createTestRegion("test1");
        const testRegion2 = MockFactory.createTestRegion("test2");

        newWrapper.find(Canvas).prop("selectedAsset").regions.push(testRegion1);
        newWrapper.find(Canvas).prop("selectedAsset").regions.push(testRegion2);

        return newWrapper;
    }

    function dispatchKeyEvent(key, eventType= KeyEventType.KeyDown) {
        window.dispatchEvent(new KeyboardEvent(eventType, {key}));
    }

    it("Multiple regions can be selected when shift key is pressed", () => {

        const newWrapper = getPopulatedWrapper();

        // Enable multi-select
        dispatchKeyEvent("Shift");

        const canvas = newWrapper.find(Canvas).instance() as Canvas;

        canvas.onRegionSelected("test1");
        canvas.onRegionSelected("test2");

        expect(newWrapper.find(Canvas).state().selectedRegions).toHaveLength(2);

        // Disable multi-select
        dispatchKeyEvent("Shift", KeyEventType.KeyUp);

        canvas.onRegionSelected("test1");
        canvas.onRegionSelected("test2");

        expect(newWrapper.find(Canvas).state().selectedRegions).toHaveLength(1);
    });

    it("Regions are removed from asset and pasted into asset with paste command", () => {
        const newWrapper = getPopulatedWrapper();

        // Enable multi-select
        dispatchKeyEvent("Shift");

        const canvas = newWrapper.find(Canvas).instance() as Canvas;

        canvas.onRegionSelected("test1");
        canvas.onRegionSelected("test2");

        window.dispatchEvent(new KeyboardEvent(
            KeyEventType.KeyDown, {
            key: "Ctrl+x",
        }));

        expect(newWrapper.find(Canvas).prop("selectedAsset").regions).toHaveLength(0);

        window.dispatchEvent(new KeyboardEvent(
            KeyEventType.KeyDown, {
            key: "Ctrl+v",
        }));

        expect(newWrapper.find(Canvas).prop("selectedAsset").regions).toHaveLength(2);
    });

    it("Regions are copied and pasted into same asset with paste command", () => {
        const newWrapper = getPopulatedWrapper();

        // Enable multi-select
        dispatchKeyEvent("Shift");

        const canvas = newWrapper.find(Canvas).instance() as Canvas;

        canvas.onRegionSelected("test1");
        canvas.onRegionSelected("test2");

        expect(newWrapper.find(Canvas).state().selectedRegions).toHaveLength(2);

        window.dispatchEvent(new KeyboardEvent(
            KeyEventType.KeyDown, {
            key: "Ctrl+c",
        }));

        expect(newWrapper.find(Canvas).prop("selectedAsset").regions).toHaveLength(2);

        window.dispatchEvent(new KeyboardEvent(
            KeyEventType.KeyDown, {
            key: "Ctrl+v",
        }));

        expect(newWrapper.find(Canvas).prop("selectedAsset").regions).toHaveLength(4);
    });

    it("All regions are selected with select all command", () => {
        const newWrapper = getPopulatedWrapper();

        window.dispatchEvent(new KeyboardEvent(
            KeyEventType.KeyDown, {
            key: "Ctrl+a",
        }));

        expect(newWrapper.find(Canvas).state().selectedRegions).toHaveLength(2);
    });

    it("All regions are deleted with clear command", () => {
        const newWrapper = getPopulatedWrapper();

        window.dispatchEvent(new KeyboardEvent(
            KeyEventType.KeyDown, {
            key: "Ctrl+a",
        }));

        expect(newWrapper.find(Canvas).state().selectedRegions).toHaveLength(2);

        window.dispatchEvent(new KeyboardEvent(
            KeyEventType.KeyDown, {
            key: "Ctrl+d",
        }));

        expect(newWrapper.find(Canvas).prop("selectedAsset").regions).toHaveLength(0);
    });
});
