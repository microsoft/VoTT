import { mount, ReactWrapper } from "enzyme";
import React from "react";
import { Provider } from "react-redux";
import MockFactory from "../../../../common/mockFactory";
import ProjectMetrics, { IProjectMetricsProps, IProjectMetricsState } from "./projectMetrics";
import _ from "lodash";

import { IAsset, IAssetMetadata } from "../../../../models/applicationState";
import { AssetService } from "../../../../services/assetService";
import * as packageJson from "../../../../../package.json";

describe("Project metrics page", () => {
    const defaultProject = MockFactory.createTestProject("TestProject");
    let wrapper: ReactWrapper<IProjectMetricsProps, IProjectMetricsState> = null;
    let mockAssetService: jest.Mocked<typeof AssetService> = null;
    let testAssetsMetadata: IAssetMetadata[] = null;
    let testAssets: IAsset[] = null;
    const testAssetCount = 10;

    function createComponent(props: IProjectMetricsProps): ReactWrapper<IProjectMetricsProps, IProjectMetricsState> {
        return mount(
            <ProjectMetrics
                {...props}
            />,
        );
    }

    beforeAll(() => {
        mockAssetService = AssetService as jest.Mocked<typeof AssetService>;

        testAssets = MockFactory.createTestAssets(testAssetCount);
        mockAssetService.prototype.getAssets = jest.fn(() => Promise.resolve(testAssets));

        testAssetsMetadata = _.map(testAssets, (asset) => {
            return {
                asset: {...asset},
                regions: [MockFactory.createTestRegion()],
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

        wrapper = createComponent({
            project: {
                ...defaultProject,
                assets: _.keyBy(testAssets, (asset) => asset.id),
            },
        });
    });

    describe("project has no asset metadata", () => {
        return;
    });

    describe("project has no tags", () => {
        beforeEach(() => {
            const project = {
                ...defaultProject,
                tags: [],
            };

            wrapper = createComponent({
                project,
            });
        });

        it("return 0", async () => {
            await MockFactory.flushUi();
            const tagCategoriesCount = wrapper.find(".tag-categories-count");
            expect(tagCategoriesCount).toEqual("0");
        });
    });

    it("correctly calculate state", async () => {
        await MockFactory.flushUi();
        expect(wrapper.state().sourceAssets === testAssets);
        expect(wrapper.state().projectAssetsMetadata === testAssetsMetadata);
        return;
    });

    it("calculates the right categories count", async () => {
        await MockFactory.flushUi();
        const tagCategoriesCount = wrapper.find(".tag-categories-count");
        expect(tagCategoriesCount).toEqual(defaultProject.tags.length);
    });

    it("correctly calculates source asset count", async () => {
        await MockFactory.flushUi();
        const sourceAssetCount = wrapper.find(".source-asset-count");
        expect(sourceAssetCount.html()).toEqual(`${testAssetCount}`);
    });

    it("correctly calculate visited asset count", async () => {
        await MockFactory.flushUi();
        const visitedAssetCount = wrapper.find(".visited-asset-count");
        expect(visitedAssetCount).toEqual(defaultProject.tags.length);
    });

    it("correctly calculate tagged asset count", async () => {
        await MockFactory.flushUi();
        const taggedAssetCount = wrapper.find(".tagged-asset-count");
        expect(taggedAssetCount).toEqual(defaultProject.tags.length);
    });

    it("correctly calculate per tag total", async () => {
        await MockFactory.flushUi();
        const tagCount = wrapper.find(".tag-count");
        expect(tagCount).toEqual(1);
    });

    it("correctly calculate average tags count", async () => {
        const expectedAvg = 0;
        await MockFactory.flushUi();
        const avgTagCount = wrapper.find(".average-tag-count");
        expect(avgTagCount).toEqual(1);
    });
});
