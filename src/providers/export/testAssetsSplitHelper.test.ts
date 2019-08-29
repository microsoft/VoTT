import _ from "lodash";
import {
    IAssetMetadata, AssetState, IRegion,
    RegionType, IPoint, IExportProviderOptions,
} from "../../models/applicationState";
import MockFactory from "../../common/mockFactory";
import { splitTestAsset } from "./testAssetsSplitHelper";
import { appInfo } from "../../common/appInfo";

describe("splitTestAsset Helper tests", () => {

    describe("Test Train Splits", () => {
        async function testTestTrainSplit(testTrainSplit: number): Promise<void> {
            const assetArray = MockFactory.createTestAssets(13, 0);
            const tags = MockFactory.createTestTags(2);
            assetArray.forEach((asset) => asset.state = AssetState.Tagged);

            const testSplit = (100 - testTrainSplit) / 100;
            const testCount = Math.ceil(testSplit * assetArray.length);

            const assetMetadatas = assetArray.map((asset, i) =>
                MockFactory.createTestAssetMetadata(asset,
                    i < (assetArray.length - testCount) ?
                        [MockFactory.createTestRegion("Region" + i, [tags[0].name])] :
                        [MockFactory.createTestRegion("Region" + i, [tags[1].name])]));
            const testAssetsNames = splitTestAsset(assetMetadatas, tags, testSplit);

            const trainAssetsArray = assetMetadatas.filter((assetMetadata) =>
                testAssetsNames.indexOf(assetMetadata.asset.name) < 0);
            const testAssetsArray = assetMetadatas.filter((assetMetadata) =>
                testAssetsNames.indexOf(assetMetadata.asset.name) >= 0);

            const expectedTestCount = Math.ceil(testSplit * testCount) +
                Math.ceil(testSplit * (assetArray.length - testCount));
            expect(testAssetsNames).toHaveLength(expectedTestCount);
            expect(trainAssetsArray.length + testAssetsArray.length).toEqual(assetMetadatas.length);
            expect(testAssetsArray).toHaveLength(expectedTestCount);

            expect(testAssetsArray.filter((assetMetadata) => assetMetadata.regions[0].tags[0] === tags[0].name).length)
                .toBeGreaterThan(0);
            expect(testAssetsArray.filter((assetMetadata) => assetMetadata.regions[0].tags[0] === tags[1].name).length)
                .toBeGreaterThan(0);
        }

        it("Correctly generated files based on 50/50 test / train split", async () => {
            await testTestTrainSplit(50);
        });

        it("Correctly generated files based on 60/40 test / train split", async () => {
            await testTestTrainSplit(60);
        });

        it("Correctly generated files based on 80/20 test / train split", async () => {
            await testTestTrainSplit(80);
        });

        it("Correctly generated files based on 90/10 test / train split", async () => {
            await testTestTrainSplit(90);
        });
    });
});
