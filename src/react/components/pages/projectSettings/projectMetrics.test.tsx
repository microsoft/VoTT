import { mount, ReactWrapper } from "enzyme";
import React from "react";
import { Provider } from "react-redux";
import MockFactory from "../../../../common/mockFactory";
import ProjectMetrics, { IProjectMetricsProps, IProjectMetricsState } from "./projectMetrics";
import _ from "lodash";

import { AssetState } from "../../../../models/applicationState";
import { AssetService } from "../../../../services/assetService";
import * as packageJson from "../../../../../package.json";

describe("Project metrics page", () => {

    let wrapper: ReactWrapper<IProjectMetricsProps, IProjectMetricsState> = null;

    const testAssetCount = 10;
    const testAssets = MockFactory.createTestAssets(testAssetCount);

    const defaultTagCount = 4;
    const skeletonProject = MockFactory.createTestProject("TestProject", defaultTagCount);
    const defaultProject = {
        ...skeletonProject,
        assets: _.keyBy(testAssets, (asset) => asset.id),
    };

    describe("regular project", () => {
        beforeEach(async () => {
            setUpMockAssetService(testAssets);

            wrapper = createComponent({
                project: defaultProject,
            });

            await MockFactory.flushUi();
            wrapper.update();
        });

        it("calculates categories count", async () => {
            const root = wrapper.find(".tag-categories");

            const tagCategoriesCount = root.find(".count");
            expect(tagCategoriesCount.text()).toEqual(defaultTagCount.toString());

            const tagList = root.find(".list").find("li");
            expect(tagList).toHaveLength(defaultTagCount);
        });

        it("calculates source asset count", async () => {
            const sourceAssetCount = wrapper.find(".source-asset-count");
            expect(sourceAssetCount.text()).toEqual(testAssetCount.toString());
        });

        it("calculate tagged asset count", async () => {
            const taggedAssetCount = wrapper.find(".tagged-asset-count");
            expect(taggedAssetCount.text()).toEqual("8");
        });

        it("calculate per tag total", async () => {
            // 4 tag categories, 8 tagged asset
            const assetCountPerTag = 2;

            const tagCount = wrapper.find(".Tag-0");
            expect(tagCount.text()).toEqual(assetCountPerTag.toString());
        });

        it("correctly calculate average tags count", async () => {
            // 8 tagged asset, each one has one tag
            const avgTagCount = wrapper.find(".average-tag-count");
            expect(avgTagCount.text()).toEqual("1");
        });

        it("correctly calculate visited asset count", async () => {
            const visitedAssetCount = wrapper.find(".visited-asset-count");
            expect(visitedAssetCount.text()).toEqual("2");
        });
    });

    describe("tag name has dash", () => {
        beforeEach(async () => {
            setUpMockAssetService(testAssets);

            const project = {
                ...defaultProject,
                tags: [
                    {
                        ...defaultProject.tags[0],
                        name: `Tag-0`,
                    },
                ],
            };

            wrapper = createComponent({
                project,
            });

            await MockFactory.flushUi();
            wrapper.update();
        });

        it("generate the right span class name ", async () => {
            const tagCount = wrapper.find(".Tag-0");
            expect(tagCount).toHaveLength(1);
        });
    });

    describe("project has no tags", () => {
        beforeEach(async () => {
            setUpMockAssetService(testAssets);

            const project = {
                ...defaultProject,
                tags: [],
            };

            wrapper = createComponent({
                project,
            });

            await MockFactory.flushUi();
            wrapper.update();
        });

        it("tag categories count is 0", async () => {
            const root = wrapper.find(".tag-categories");

            const tagCategoriesCount = root.find(".count");
            expect(tagCategoriesCount.text()).toEqual("0");

            const tagList = root.find(".list").find("#li");
            expect(tagList).toHaveLength(0);
        });
    });

    const setUpMockAssetService = (testAssets = []) => {
        const mockAssetService = AssetService as jest.Mocked<typeof AssetService>;
        mockAssetService.prototype.getAssets = jest.fn(() => Promise.resolve(testAssets));

        const testAssetsMetadata = _.map(testAssets, (asset, index: number) => {
            const tagIndex = index % defaultTagCount;
            console.log(tagIndex);
            const tags = [defaultProject.tags[tagIndex].name];

            const state = index % 5 === 0 ? AssetState.Visited : AssetState.Tagged;
            const regions = state === AssetState.Visited ? [] : [MockFactory.createTestRegion(asset.id, tags)];
            return {
                asset: {
                    ...asset,
                    state,
                },
                regions,
                version: packageJson.version,
            };
        });

        mockAssetService.prototype.getAssetMetadata = jest.fn((asset) => {
            const item = _.find(
                testAssetsMetadata,
                (metadata) => metadata.asset.id === asset.id,
            );

            return Promise.resolve(item);
        });
    };

    const createComponent = (props: IProjectMetricsProps): ReactWrapper<IProjectMetricsProps, IProjectMetricsState> => {
        return mount(
            <ProjectMetrics
                {...props}
            />,
        );
    };
})
;
