global["TextEncoder"] = {};
const te = new TextEncoder();

import { ActiveLearningService } from "./activeLearningService";
import { IActiveLearningSettings, ModelPathType, IAssetMetadata, AssetState } from "../models/applicationState";
import MockFactory from "../common/mockFactory";
import { appInfo } from "../common/appInfo";
import { ObjectDetection } from "../providers/activeLearning/objectDetection";

describe("Active Learning Service", () => {
    const objectDetectionMock = ObjectDetection as jest.Mocked<typeof ObjectDetection>;
    const defaultSettings: IActiveLearningSettings = {
        modelPathType: ModelPathType.Coco,
        autoDetect: true,
        predictTag: true,
    };

    let activeLearningService: ActiveLearningService = null;

    const electronMock = {
        remote: {
            app: {
                getAppPath: jest.fn(),
            },
        },
    };

    beforeAll(() => {
        window["require"] = jest.fn(() => electronMock);
    });

    beforeEach(() => {
        activeLearningService = new ActiveLearningService(defaultSettings);
        objectDetectionMock.prototype.load = jest.fn(() => Promise.resolve());
        objectDetectionMock.prototype.predictImage = jest.fn(() => Promise.resolve([]));
    });

    it("Predicts new regions to the asset metadata", async () => {
        objectDetectionMock.prototype.predictImage = jest.fn(() => Promise.resolve(expectedRegions));

        const expectedRegions = MockFactory.createTestRegions(2);
        const canvas = MockFactory.mockCanvas()();
        const asset = MockFactory.createTestAsset("TestAsset", AssetState.Visited);
        const assetMetadata: IAssetMetadata = {
            asset: {
                ...asset,
                state: AssetState.Tagged,
            },
            regions: [],
            version: appInfo.version,
        };

        const updatedAssetMetadata = await activeLearningService.predictRegions(canvas, assetMetadata);

        expect(updatedAssetMetadata).toEqual({
            asset: {
                ...assetMetadata.asset,
                predicted: true,
            },
            regions: expectedRegions,
            version: appInfo.version,
        });
    });

    it("Predicts non matching regions to the asset metadata", async () => {
        objectDetectionMock.prototype.predictImage = jest.fn(() => Promise.resolve(expectedRegions));

        const uniqueRegion = MockFactory.createTestRegion("UniqueRegion", ["tag1", "tag2"]);
        const expectedRegions = MockFactory.createTestRegions(4);
        const canvas = MockFactory.mockCanvas()();
        const asset = MockFactory.createTestAsset("TestAsset", AssetState.Visited);
        const assetMetadata: IAssetMetadata = {
            asset: {
                ...asset,
                state: AssetState.Tagged,
            },
            regions: [
                uniqueRegion,
                expectedRegions[0],
                expectedRegions[1],
            ],
            version: appInfo.version,
        };

        const updatedAssetMetadata = await activeLearningService.predictRegions(canvas, assetMetadata);

        expect(updatedAssetMetadata).toEqual({
            asset: {
                ...assetMetadata.asset,
                predicted: true,
            },
            regions: [
                uniqueRegion,
                ...expectedRegions,
            ],
            version: appInfo.version,
        });
    });

    it("ensures the underlying object detection model is only loaded 1 time", async () => {
        const canvas = MockFactory.mockCanvas()();
        const assetMetadata: IAssetMetadata = {
            asset: MockFactory.createTestAsset("TestAsset", AssetState.Visited),
            regions: [],
            version: appInfo.version,
        };

        await activeLearningService.predictRegions(canvas, assetMetadata);
        await activeLearningService.predictRegions(canvas, assetMetadata);
        await activeLearningService.predictRegions(canvas, assetMetadata);
        await activeLearningService.predictRegions(canvas, assetMetadata);
        expect(objectDetectionMock.prototype.load).toBeCalledTimes(1);
    });

    it("fails if constructor requirements aren't satisfied", () => {
        expect(() => new ActiveLearningService(null)).toThrow();
    });

    it("fails if method requirements aren't satisfied", () => {
        const service = new ActiveLearningService(defaultSettings);
        expect(service.predictRegions(null, null)).rejects.not.toBeNull();
    });
});
