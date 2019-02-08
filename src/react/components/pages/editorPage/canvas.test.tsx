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

describe("Editor Canvas", () => {
    let wrapper: ReactWrapper<ICanvasProps, ICanvasState, Canvas> = null;
    const onAssetMetadataChanged = jest.fn();

    function createTestRegionData() {
        const testRegionData = new RegionData(0, 0, 100, 100,
            [new Point2D(0, 0), new Point2D(1, 0), new Point2D(0, 1), new Point2D(1, 1)], RegionDataType.Rect);
        return testRegionData;
    }

    function createComponent(canvasProps: ICanvasProps, assetPreviewProps: IAssetPreviewProps)
        : ReactWrapper<ICanvasProps, ICanvasState, Canvas> {
        return mount(
            <Canvas {...canvasProps}>
                <AssetPreview {...assetPreviewProps} />
            </Canvas>,
        );
    }

    function createProps() {
        const assetMetadata = MockFactory.createTestAssetMetadata(MockFactory.createTestAsset("test"));

        const canvasProps: ICanvasProps = {
            selectedAsset: assetMetadata,
            onAssetMetadataChanged,
            editorMode: EditorMode.Rectangle,
            project: MockFactory.createTestProject(),
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
        editorMock.prototype.RM = new RegionsManager(null, null, null);
        editorMock.prototype.scaleRegionToSourceSize = jest.fn((regionData: any) => regionData);
    });

    beforeEach(() => {
        const props = createProps();
        wrapper = createComponent(props.canvas, props.assetPreview);
    });

    it("onSelectionEnd adds region to asset and selects it", () => {
        const testCommit = createTestRegionData();
        const canvas = wrapper.instance();
        const testRegion = MockFactory.createTestRegion();
        canvas.editor.onSelectionEnd(testCommit);

        expect(onAssetMetadataChanged).toBeCalled();
        expect(wrapper.prop("selectedAsset").regions).toMatchObject([testRegion]);
        expect(wrapper.instance().state.selectedRegions).toMatchObject([testRegion]);
    });

    it("onRegionMove edits region info in asset", () => {
        const canvas = wrapper.instance();
        const testRegion = MockFactory.createTestRegion("test-region");

        testRegion.points = [new Point2D(0, 1), new Point2D(1, 1), new Point2D(0, 2), new Point2D(1, 2)];
        wrapper.prop("selectedAsset").regions.push(testRegion);
        canvas.editor.onRegionMove("test-region", createTestRegionData());

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

        canvas.editor.onRegionSelected("test1", false);
        expect(wrapper.instance().state.selectedRegions.length).toEqual(1);
        expect(wrapper.instance().state.selectedRegions)
            .toMatchObject([MockFactory.createTestRegion("test1")]);

        canvas.editor.onRegionSelected("test2", true);
        expect(wrapper.instance().state.selectedRegions.length).toEqual(2);
        expect(wrapper.instance().state.selectedRegions)
            .toMatchObject([MockFactory.createTestRegion("test1"), MockFactory.createTestRegion("test2")]);
    });

    it("onTagClicked", () => {
        const canvas = wrapper.instance();
        const testRegion1 = MockFactory.createTestRegion("test1");
        const testRegion2 = MockFactory.createTestRegion("test2");

        wrapper.prop("selectedAsset").regions.push(testRegion1);
        wrapper.prop("selectedAsset").regions.push(testRegion2);
        canvas.editor.onRegionSelected("test1", false);
        canvas.editor.onRegionSelected("test2", true);

        const newTag = MockFactory.createTestTag();
        canvas.onTagClicked(newTag);
        for (const region of wrapper.instance().state.selectedRegions) {
            expect(region.tags.findIndex((tag) => tag === newTag)).toBeGreaterThanOrEqual(0);
        }
    });
});
