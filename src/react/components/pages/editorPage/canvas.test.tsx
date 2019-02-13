import React from "react";
import { ReactWrapper, mount } from "enzyme";
import Canvas, { ICanvasProps, ICanvasState } from "./canvas";
import { RegionData, RegionDataType } from "vott-ct/lib/js/CanvasTools/Core/RegionData";
import { Point2D } from "vott-ct/lib/js/CanvasTools/Core/Point2D";
import { AssetPreview, IAssetPreviewProps } from "../../common/assetPreview/assetPreview";
import MockFactory from "../../../../common/mockFactory";
import { EditorMode, ITag, IAssetMetadata, IRegion } from "../../../../models/applicationState";

jest.mock("vott-ct/lib/js/CanvasTools/CanvasTools.Editor");
import { Editor } from "vott-ct/lib/js/CanvasTools/CanvasTools.Editor";

jest.mock("vott-ct/lib/js/CanvasTools/Region/RegionsManager");
import { RegionsManager } from "vott-ct/lib/js/CanvasTools/Region/RegionsManager";
import { SelectionMode } from "vott-ct/lib/js/CanvasTools/Selection/AreaSelector";
import { KeyCodes } from "../../../../common/utils";
import { KeyEventType, KeyboardManager } from "../../common/keyboardManager/keyboardManager";

describe("Editor Canvas", () => {
    const onAssetMetadataChanged = jest.fn();

    function createComponent(
        includeKeyboard = false, canvasProps?: ICanvasProps, assetPreviewProps?: IAssetPreviewProps):
            ReactWrapper<ICanvasProps, ICanvasState, Canvas> {
        const props = createProps();
        if (includeKeyboard) {
            return mount(
                <KeyboardManager>
                    <Canvas {...canvasProps || props.canvas}>
                        <AssetPreview {...assetPreviewProps || props.assetPreview} />
                    </Canvas>
                </KeyboardManager>,
            );
        } else {
            return mount(
                <Canvas {...canvasProps || props.canvas}>
                    <AssetPreview {...assetPreviewProps || props.assetPreview} />
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
            lockedTags: [],
            selectedTag: null,
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

    it("renders correctly from default state", () => {
        const wrapper = createComponent();
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

        const wrapper = createComponent();

        wrapper.setProps({ selectedAsset: assetMetadata });
        expect(wrapper.instance().editor.RM.deleteAllRegions).toBeCalled();
        expect(wrapper.state().selectedRegions).toEqual([]);
    });

    it("canvas is updated when asset loads", () => {

        const wrapper = createComponent();

        wrapper.find(AssetPreview).props().onLoaded(expect.any(HTMLImageElement));

        expect(wrapper.instance().editor.addContentSource).toBeCalledWith(expect.any(HTMLImageElement));
        expect(wrapper.state().contentSource).toEqual(expect.any(HTMLImageElement));
    });

    it("canvas is enabled when an asset is deactivated", () => {
        const wrapper = createComponent();

        wrapper.find(AssetPreview).props().onDeactivated(expect.any(HTMLImageElement));

        expect(wrapper.instance().editor.addContentSource).toBeCalledWith(expect.any(HTMLImageElement));
        expect(wrapper.state().canvasEnabled).toEqual(true);
    });

    it("canvas is deactivated when an asset is activated", () => {
        const wrapper = createComponent();

        wrapper.find(AssetPreview).props().onActivated(expect.any(HTMLImageElement));
        expect(wrapper.state().canvasEnabled).toEqual(false);
    });

    it("onSelectionEnd adds region to asset and selects it", () => {
        const wrapper = createComponent();

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

        const wrapper = createComponent();

        // Clear out mock counts
        (wrapper.instance().editor.RM.addRegion as any).mockClear();

        wrapper.setProps({ selectedAsset: assetMetadata });
        wrapper.find(AssetPreview).props().onLoaded(expect.any(HTMLImageElement));

        await MockFactory.flushUi();

        expect(wrapper.instance().editor.RM.addRegion).toBeCalledTimes(assetMetadata.regions.length);
        expect(wrapper.state().selectedRegions).toEqual([assetMetadata.regions[assetMetadata.regions.length - 1]]);
    });

    it("onRegionMove edits region info in asset", () => {
        const wrapper = createComponent();

        const canvas = wrapper.instance();
        const testRegion = MockFactory.createTestRegion("test-region");

        testRegion.points = [new Point2D(0, 1), new Point2D(1, 1), new Point2D(0, 2), new Point2D(1, 2)];
        wrapper.prop("selectedAsset").regions.push(testRegion);
        canvas.editor.onRegionMove("test-region", MockFactory.createTestRegionData());

        expect(onAssetMetadataChanged).toBeCalled();
        expect(wrapper.prop("selectedAsset").regions).toMatchObject([MockFactory.createTestRegion("test-region")]);
    });

    it("onRegionDelete removes region from asset and clears selectedRegions", () => {
        const wrapper = createComponent();

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
        const wrapper = createComponent();

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

        const wrapper = createComponent(true).find(Canvas);

        expect(wrapper.state().multiSelect).toBe(false);

        window.dispatchEvent(new KeyboardEvent(
            KeyEventType.KeyDown, {
            key: "Shift",
        }));

        expect(wrapper.state().multiSelect).toBe(true);

        window.dispatchEvent(new KeyboardEvent(
            KeyEventType.KeyUp, {
            key: "Shift",
        }));

        expect(wrapper.state().multiSelect).toBe(false);
    });

    function getPopulatedWrapper(numRegions = 5) {
        const wrapper = createComponent(true).find(Canvas);

        for (let i = 0; i < numRegions; i++) {
            wrapper.prop("selectedAsset").regions.push(MockFactory.createTestRegion(`test${i + 1}`));
        }

        return wrapper;
    }

    function dispatchKeyEvent(key, eventType= KeyEventType.KeyDown) {
        window.dispatchEvent(new KeyboardEvent(eventType, {key}));
    }

    it("Multiple regions can be selected when shift key is pressed", () => {

        const wrapper = getPopulatedWrapper();

        expect(wrapper.state().multiSelect).toBe(false);

        // Enable multi-select
        dispatchKeyEvent("Shift");

        expect(wrapper.state().multiSelect).toBe(true);

        const canvas = wrapper.instance() as Canvas;

        canvas.onRegionSelected("test1");
        canvas.onRegionSelected("test2");

        expect(wrapper.state().selectedRegions).toHaveLength(2);

        // Disable multi-select
        dispatchKeyEvent("Shift", KeyEventType.KeyUp);

        canvas.onRegionSelected("test1");
        canvas.onRegionSelected("test2");

        expect(wrapper.state().selectedRegions).toHaveLength(1);
    });

    it("Multiple regions can be unselected when shift key is pressed", () => {

        const wrapper = getPopulatedWrapper();

        expect(wrapper.state().multiSelect).toBe(false);

        // Enable multi-select
        dispatchKeyEvent("Shift");

        expect(wrapper.state().multiSelect).toBe(true);

        const canvas = wrapper.instance() as Canvas;

        canvas.onRegionSelected("test1");
        canvas.onRegionSelected("test2");
        canvas.onRegionSelected("test3");

        expect(wrapper.state().selectedRegions).toHaveLength(3);
        expect(wrapper.state().selectedRegions.find((r) => r.id === "test1")).not.toBeNull();
        expect(wrapper.state().selectedRegions.find((r) => r.id === "test2")).not.toBeNull();
        expect(wrapper.state().selectedRegions.find((r) => r.id === "test3")).not.toBeNull();

        canvas.onRegionSelected("test3");

        expect(wrapper.state().selectedRegions).toHaveLength(2);
        expect(wrapper.state().selectedRegions.find((r) => r.id === "test1")).not.toBeNull();
        expect(wrapper.state().selectedRegions.find((r) => r.id === "test2")).not.toBeNull();
        canvas.onRegionSelected("test2");

        expect(wrapper.state().selectedRegions).toHaveLength(1);
        expect(wrapper.state().selectedRegions.find((r) => r.id === "test1")).not.toBeNull();

        canvas.onRegionSelected("test1");

        expect(wrapper.state().selectedRegions).toHaveLength(0);
    });

    it("Regions are removed from asset with cut command and pasted into asset with paste command", () => {
        const numRegions = 5;
        const wrapper = getPopulatedWrapper(numRegions);

        // Enable multi-select
        dispatchKeyEvent("Shift");

        const canvas = wrapper.instance() as Canvas;

        canvas.onRegionSelected("test1");
        canvas.onRegionSelected("test2");

        window.dispatchEvent(new KeyboardEvent(
            KeyEventType.KeyDown, {
            key: "Ctrl+x",
        }));

        expect(wrapper.prop("selectedAsset").regions).toHaveLength(numRegions - 2);

        window.dispatchEvent(new KeyboardEvent(
            KeyEventType.KeyDown, {
            key: "Ctrl+v",
        }));

        expect(wrapper.prop("selectedAsset").regions).toHaveLength(numRegions);
    });

    it("Regions are copied and pasted into same asset with paste command", () => {
        const numRegions = 5;
        const wrapper = getPopulatedWrapper(numRegions);

        // Enable multi-select
        dispatchKeyEvent("Shift");

        const canvas = wrapper.instance() as Canvas;

        canvas.onRegionSelected("test1");
        canvas.onRegionSelected("test2");

        expect(wrapper.state().selectedRegions).toHaveLength(2);

        window.dispatchEvent(new KeyboardEvent(
            KeyEventType.KeyDown, {
            key: "Ctrl+c",
        }));

        expect(wrapper.prop("selectedAsset").regions).toHaveLength(numRegions);

        window.dispatchEvent(new KeyboardEvent(
            KeyEventType.KeyDown, {
            key: "Ctrl+v",
        }));

        expect(wrapper.prop("selectedAsset").regions).toHaveLength(numRegions + 2);
    });

    it("All regions are selected with select all command", () => {
        const numRegions = 5;
        const wrapper = getPopulatedWrapper(numRegions);

        window.dispatchEvent(new KeyboardEvent(
            KeyEventType.KeyDown, {
            key: "Ctrl+a",
        }));

        expect(wrapper.state().selectedRegions).toHaveLength(numRegions);
    });

    it("All regions are deleted with clear command", () => {
        const numRegions = 5;
        const wrapper = getPopulatedWrapper(numRegions);

        window.dispatchEvent(new KeyboardEvent(
            KeyEventType.KeyDown, {
            key: "Ctrl+a",
        }));

        expect(wrapper.state().selectedRegions).toHaveLength(numRegions);

        window.dispatchEvent(new KeyboardEvent(
            KeyEventType.KeyDown, {
            key: "Ctrl+d",
        }));

        expect(wrapper.prop("selectedAsset").regions).toHaveLength(0);
    });

    const tag1 = MockFactory.createTestTag("tag1");
    const tag2 = MockFactory.createTestTag("tag2");
    const tag3 = MockFactory.createTestTag("tag3");

    function getTaggedRegions(): IRegion[] {
        const region1 = MockFactory.createTestRegion("region1");
        const region2 = MockFactory.createTestRegion("region2");
        const region3 = MockFactory.createTestRegion("region3");
        const region4 = MockFactory.createTestRegion("region4");

        region1.tags = [ tag1, tag2 ];
        region2.tags = [ tag2 ];
        region3.tags = [ tag2, tag3 ];

        return [region1, region2, region3, region4]
    }

    function getWrapperWithTaggedRegions() {
        const regions = getTaggedRegions();

        const wrapper = createComponent();
        for (const region of regions) {
            wrapper.prop("selectedAsset").regions.push(region);
        }
        return wrapper;
    }

    function checkRegionTags(wrapper, ...tagArrays: ITag[][]) {
        expect(wrapper.state().selectedRegions).toHaveLength(tagArrays.length);
        for (let i = 0; i < tagArrays.length; i++) {
            expect(wrapper.state().selectedRegions[i].tags).toEqual(tagArrays[i]);
        }
    }

    it("Toggles single tag for single region", () => {

        const wrapper = getWrapperWithTaggedRegions();
        const canvas = wrapper.instance();
        canvas.onRegionSelected("region1");
        expect(wrapper.state().selectedRegions).toHaveLength(1);

        checkRegionTags(wrapper, [tag1, tag2]);

        wrapper.setProps({
            selectedTag: tag1,
            lockedTags: [],
        });

        checkRegionTags(wrapper, [tag2]);

        wrapper.setProps({
            selectedTag: tag2,
            lockedTags: [],
        });

        checkRegionTags(wrapper, []);

        expect(wrapper.state().selectedRegions[0].tags).toEqual([]);

        wrapper.setProps({
            selectedTag: tag3,
            lockedTags: [],
        });

        checkRegionTags(wrapper, [tag3]);

        wrapper.setProps({
            selectedTag: tag1,
            lockedTags: [],
        });

        checkRegionTags(wrapper, [tag3, tag1]);

        wrapper.setProps({
            selectedTag: tag2,
            lockedTags: [],
        });

        checkRegionTags(wrapper, [tag3, tag1, tag2]);
    });

    it("Toggles single tag for multiple regions", () => {
        const wrapper = getWrapperWithTaggedRegions();
        const canvas = wrapper.instance();
        wrapper.setState({
            contentSource: null,
            selectedRegions: [],
            canvasEnabled: true,
            multiSelect: true,
        });
        canvas.onRegionSelected("region1");
        canvas.onRegionSelected("region2");
        canvas.onRegionSelected("region4");
        expect(wrapper.state().selectedRegions).toHaveLength(3);

        checkRegionTags(wrapper, [tag1, tag2 ], [ tag2 ], []);

        wrapper.setProps({
            selectedTag: tag1,
            lockedTags: [],
        });

        checkRegionTags(wrapper, [tag2], [], [tag1]);

        wrapper.setProps({
            selectedTag: tag2,
            lockedTags: [],
        });

        checkRegionTags(wrapper, [], [tag2], [tag1, tag2]);

        wrapper.setProps({
            selectedTag: tag3,
            lockedTags: [],
        });

        checkRegionTags(wrapper, [tag3], [tag2, tag3], [tag1, tag2, tag3]);

        wrapper.setProps({
            selectedTag: tag1,
            lockedTags: [],
        });

        checkRegionTags(wrapper, [tag3, tag1], [tag2, tag3, tag1], [tag2, tag3]);

        wrapper.setProps({
            selectedTag: tag2,
            lockedTags: [],
        });

        checkRegionTags(wrapper, [tag3, tag1, tag2], [tag3, tag1], [tag3]);
    });

    it("Toggles locked tags on selection of single region", () => {
        const wrapper = getWrapperWithTaggedRegions();
        const canvas = wrapper.instance();
        expect(wrapper.state().selectedRegions).toHaveLength(0);

        wrapper.setProps({
            selectedTag: tag1,
            lockedTags: [ tag1, tag2 ]
        });

        canvas.onRegionSelected("region1");
        checkRegionTags(wrapper, []);

        canvas.onRegionSelected("region1");
        checkRegionTags(wrapper, [tag1, tag2]);

        canvas.onRegionSelected("region1");
        checkRegionTags(wrapper, []);

        canvas.onRegionSelected("region2");
        checkRegionTags(wrapper, [ tag1 ]);

        canvas.onRegionSelected("region2");
        checkRegionTags(wrapper, [ tag2 ]);

        canvas.onRegionSelected("region2");
        checkRegionTags(wrapper, [ tag1 ]);

        canvas.onRegionSelected("region3");
        checkRegionTags(wrapper, [ tag3, tag1 ]);

        canvas.onRegionSelected("region3");
        checkRegionTags(wrapper, [ tag3, tag2 ]);

        canvas.onRegionSelected("region3");
        checkRegionTags(wrapper, [ tag3, tag1 ]);

        canvas.onRegionSelected("region4");
        checkRegionTags(wrapper, [ tag1, tag2 ]);

        canvas.onRegionSelected("region4");
        checkRegionTags(wrapper, []);

        canvas.onRegionSelected("region4");
        checkRegionTags(wrapper, [ tag1, tag2 ]);
    });

    function getExpectedAssetMetadata(newAssetMetadata: IAssetMetadata, region: IRegion, expectedTags: ITag[]) {
            const expectedMetadata: IAssetMetadata = {
                ...newAssetMetadata,
                regions: newAssetMetadata.regions.map((r) => {
                    if (r.id === region.id){
                        return {
                            ...r,
                            tags: expectedTags
                        }
                    } else {
                        return r;
                    }
                }),               
            }
            return expectedMetadata;
        }

    it("Calls onAssetChanged handler after applying a tag", () => {
        const wrapper = getWrapperWithTaggedRegions();
        const canvas = wrapper.instance();
        const assetChangeHandler = jest.fn();
        wrapper.setProps({
            onAssetMetadataChanged: assetChangeHandler
        });
        expect(wrapper.state().selectedRegions).toHaveLength(0);

        const originalMetadata = MockFactory.createTestAssetMetadata(MockFactory.createTestAsset("test"));
        const originalRegions = getTaggedRegions();
        const newAssetMetadata = {
            ...originalMetadata,
            regions: originalRegions
        }

        const expected1 = getExpectedAssetMetadata(newAssetMetadata, originalRegions[0], []);
        
        wrapper.setProps({
            selectedTag: tag1,
            lockedTags: [ tag1, tag2 ]
        });

        canvas.onRegionSelected("region1");
        expect(assetChangeHandler).toBeCalledWith(expected1);

        const expected2 = getExpectedAssetMetadata(expected1, originalRegions[1], [tag1]);
        canvas.onRegionSelected("region2");
        expect(assetChangeHandler).toBeCalledWith(expected2);

        const expected3 = getExpectedAssetMetadata(expected2, originalRegions[2], [tag3, tag1]);

        canvas.onRegionSelected("region3");
        expect(assetChangeHandler).toBeCalledWith(expected3);

        const expected4 = getExpectedAssetMetadata(expected3, originalRegions[3], [tag1, tag2]);

        canvas.onRegionSelected("region4");
        expect(assetChangeHandler).toBeCalledWith(expected4);
    })

    it("Toggles locked tags on selection for multiple regions", () => {

    })

    // it("Toggles multiple tags for single region", () => {

    // });

    // it("Tag stress test", () => {

    // });
});
