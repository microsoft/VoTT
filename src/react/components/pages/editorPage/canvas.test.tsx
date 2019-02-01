import React from "react";
import _ from "lodash";
import MockFactory from "../../../../common/mockFactory";
import { ReactWrapper, mount, shallow, ShallowWrapper } from "enzyme";
import Canvas, { ICanvasProps } from "./canvas";
import { EditorMode, IAssetMetadata } from "../../../../models/applicationState";
import { RegionData, RegionDataType } from "vott-ct/lib/js/CanvasTools/Core/RegionData";
import { Point2D } from "vott-ct/lib/js/CanvasTools/Core/Point2D";
import { Player } from "video-react";

jest.mock("vott-ct");
import { CanvasTools } from "vott-ct";
import { AssetService } from "../../../../services/assetService";
import ProjectService from "../../../../services/projectService";
import { AssetProviderFactory } from "../../../../providers/storage/assetProviderFactory";

function createTestRegionData() {
    const testRegionData = new RegionData(0, 0, 100, 100,
        [new Point2D(0, 0), new Point2D(1, 0), new Point2D(0, 1), new Point2D(1, 1)], RegionDataType.Rect);
    return testRegionData;
}

function createComponent(props: ICanvasProps): ReactWrapper<ICanvasProps, {}, Canvas> {
    return mount(<Canvas {...props} />);
}

const onAssetMetadataChanged = jest.fn();

function createProps(): ICanvasProps {
    return {
        selectedAsset: MockFactory.createTestAssetMetadata(MockFactory.createTestAsset("test")),
        onAssetMetadataChanged,
        editorMode: EditorMode.Rectangle,
        project: MockFactory.createTestProject(),
        canvasAsset: MockFactory.createTestAssetMetadata(MockFactory.createTestAsset("test")),
        onVideoPaused: jest.fn(),
    };
}

describe("Editor Canvas", () => {
    let wrapper: ReactWrapper<ICanvasProps, {}, Canvas> = null;

    beforeAll(() => {
        const editorMock = CanvasTools.Editor as any;
        editorMock.prototype.RM = new CanvasTools.Region.RegionsManager(null, null);
        editorMock.prototype.AS = new CanvasTools.Selection.AreaSelector(null, null);
        editorMock.prototype.scaleRegionToSourceSize = jest.fn((regionData: any) => regionData);
    });

    beforeEach(() => {
        const props = createProps();
        wrapper = createComponent(props);
    });

    it("onSelectionEnd adds region to asset and selects it", () => {
        const testCommit = createTestRegionData();
        const canvas = wrapper.instance();
        const testRegion  = MockFactory.createTestRegion();
        canvas.onSelectionEnd(testCommit);

        expect(onAssetMetadataChanged).toBeCalled();
        expect(wrapper.prop("canvasAsset").regions).toMatchObject([testRegion]);
        expect(wrapper.instance().state.selectedRegions).toMatchObject([testRegion]);
    });

    it("onRegionMove edits region info in asset", () => {
        const canvas = wrapper.instance();
        const testRegion = MockFactory.createTestRegion("test-region");
        testRegion.points = [new Point2D(0, 1), new Point2D(1, 1), new Point2D(0, 2), new Point2D(1, 2)];
        wrapper.prop("canvasAsset").regions.push(testRegion);
        canvas.onRegionMoveEnd("test-region", createTestRegionData());
        expect(onAssetMetadataChanged).toBeCalled();
        expect(wrapper.prop("canvasAsset").regions).toMatchObject([MockFactory.createTestRegion("test-region")]);
    });

    it("onRegionDelete removes region from asset and clears selectedRegions", () => {
        const canvas = wrapper.instance();
        const testRegion = MockFactory.createTestRegion("test-region");
        wrapper.prop("canvasAsset").regions.push(testRegion);
        expect(wrapper.prop("canvasAsset").regions.length).toEqual(1);
        canvas.onRegionDelete("test-region");
        expect(onAssetMetadataChanged).toBeCalled();
        expect(wrapper.prop("canvasAsset").regions.length).toEqual(0);
        expect(wrapper.instance().state.selectedRegions.length).toEqual(0);
    });

    it("onRegionSelected adds region to list of selected regions on asset", () => {
        const canvas = wrapper.instance();
        const testRegion1 = MockFactory.createTestRegion("test1");
        const testRegion2 = MockFactory.createTestRegion("test2");
        wrapper.prop("canvasAsset").regions.push(testRegion1);
        wrapper.prop("canvasAsset").regions.push(testRegion2);
        expect(wrapper.prop("canvasAsset").regions.length).toEqual(2);
        canvas.onRegionSelected("test1", false);
        expect(wrapper.instance().state.selectedRegions.length).toEqual(1);
        expect(wrapper.instance().state.selectedRegions)
            .toMatchObject([MockFactory.createTestRegion("test1")]);
        canvas.onRegionSelected("test2", true);
        expect(wrapper.instance().state.selectedRegions.length).toEqual(2);
        expect(wrapper.instance().state.selectedRegions)
            .toMatchObject([MockFactory.createTestRegion("test1"), MockFactory.createTestRegion("test2")]);
    });

    it("onSelectionEnd adds region to correct video frame asset and selects it", () => {
        const testCommit = createTestRegionData();
        const canvas = wrapper.instance();
        const testRegion  = MockFactory.createTestRegion();
        canvas.onSelectionEnd(testCommit);

        expect(onAssetMetadataChanged).toBeCalled();
        expect(wrapper.prop("canvasAsset").regions).toMatchObject([testRegion]);
        canvas.videoPlayer.current.pause();
        expect(wrapper.instance().state.selectedRegions).toMatchObject([testRegion]);
    });
});
