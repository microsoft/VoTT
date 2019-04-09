import { mount, ReactWrapper } from "enzyme";
import React from "react";
import _ from "lodash";
import MockFactory from "../../../../common/mockFactory";
import ProjectMetrics, { IProjectMetricsProps, IProjectMetricsState } from "./projectMetrics";
import { AssetState, IProject, IAsset } from "../../../../models/applicationState";
import { AssetService } from "../../../../services/assetService";
import * as packageJson from "../../../../../package.json";
import registerMixins from "../../../../registerMixins";

registerMixins();

describe("Project metrics page", () => {

    let wrapper: ReactWrapper<IProjectMetricsProps, IProjectMetricsState> = null;

    const testProjectAssetCount = 10;
    const testSourceAssetCount = 50;
    const testAssetsWithRegion = 5;
    const regionsPerAsset = 2;
    const defaultTagCount = 5;

    const testProjectAssets = MockFactory.createTestAssets(testProjectAssetCount);
    const testSourceAssets = MockFactory.createTestAssets(testSourceAssetCount);

    const skeletonProject = MockFactory.createTestProject("TestProject", defaultTagCount);
    const defaultProject = {
        ...skeletonProject,
        assets: _.keyBy(testProjectAssets, (asset) => asset.id),
    };

    describe("still loading data", () => {
        beforeEach(async () => {
            setUpMockAssetService(defaultProject, testProjectAssets);

            wrapper = createComponent({
                project: defaultProject,
            });
        });

        it("display a spinner icon", () => {
            expect(wrapper.state().loading).toBeTruthy();
            expect(wrapper.find(".fa-circle-notch")).toHaveLength(1);
        });
    });

    describe("regular project", () => {
        beforeEach(async () => {
            setUpMockAssetService(defaultProject, testProjectAssets);

            wrapper = createComponent({
                project: defaultProject,
            });

            await MockFactory.flushUi();
            wrapper.update();
        });

        it("verify project metrics", () => {
            const expectedRegionCount = testAssetsWithRegion * regionsPerAsset;
            const expectedNonVisitedAssetCount = testSourceAssetCount - (testProjectAssetCount);
            const expectedTaggedAssets = testAssetsWithRegion;
            const expectedVistedAssets = testProjectAssetCount;
            const expectedNotTaggedAssets = expectedVistedAssets - expectedTaggedAssets;
            const expectedTagCount = wrapper.props().project.tags.length;

            expect(wrapper.find(".metric-total-asset-count").text())
                .toEqual(testSourceAssetCount.toString());
            expect(wrapper.find(".metric-total-tag-count").text())
                .toEqual(expectedTagCount.toString());
            expect(wrapper.find(".metric-total-region-count").text())
                .toEqual(expectedRegionCount.toString());
            expect(wrapper.find(".metric-avg-tag-count").text())
                .toEqual(regionsPerAsset.toFixed(2));

            // Assets graph
            const chartSegments = wrapper.find(".rv-discrete-color-legend-item__title");
            expect(chartSegments.at(0).text()).toEqual(`Visited Assets (${expectedVistedAssets})`);
            expect(chartSegments.at(1).text()).toEqual(`Not Visited Assets (${expectedNonVisitedAssetCount})`);
            expect(chartSegments.at(2).text()).toEqual(`Tagged Assets (${expectedTaggedAssets})`);
            expect(chartSegments.at(3).text()).toEqual(`Not Tagged Assets (${expectedNotTaggedAssets})`);

            // Tag graph
            const barBlocks = wrapper.find(".rv-xy-plot__series--bar");
            expect(barBlocks.children()).toHaveLength(expectedTagCount);
        });
    });

    describe("project has no tags", () => {
        beforeEach(async () => {
            const project = {
                ...defaultProject,
                tags: [],
            };

            setUpMockAssetService(project, testProjectAssets);

            wrapper = createComponent({
                project,
            });

            await MockFactory.flushUi();
            wrapper.update();
        });

        it("verify project metrics", () => {
            const expectedRegionCount = 0;
            const expectedNonVisitedAssetCount = testSourceAssetCount - (testAssetsWithRegion);
            const expectedTaggedAssets = 0;
            const expectedVistedAssets = testAssetsWithRegion;
            const expectedNotTaggedAssets = expectedVistedAssets - expectedTaggedAssets;
            const expectedTagCount = wrapper.props().project.tags.length;

            expect(wrapper.find(".metric-total-asset-count").text())
                .toEqual(testSourceAssetCount.toString());
            expect(wrapper.find(".metric-total-tag-count").text())
                .toEqual(expectedTagCount.toString());
            expect(wrapper.find(".metric-total-region-count").text())
                .toEqual(expectedRegionCount.toString());
            expect(wrapper.find(".metric-avg-tag-count").text())
                .toEqual("0");

            // Assets graph
            const chartSegments = wrapper.find(".rv-discrete-color-legend-item__title");
            expect(chartSegments.at(0).text()).toEqual(`Visited Assets (${expectedVistedAssets})`);
            expect(chartSegments.at(1).text()).toEqual(`Not Visited Assets (${expectedNonVisitedAssetCount})`);
            expect(chartSegments.at(2).text()).toEqual(`Tagged Assets (${expectedTaggedAssets})`);
            expect(chartSegments.at(3).text()).toEqual(`Not Tagged Assets (${expectedNotTaggedAssets})`);

            // Tag graph
            const barBlocks = wrapper.find(".rv-xy-plot__series--bar");
            expect(barBlocks.children()).toHaveLength(expectedTagCount);
        });
    });

    const setUpMockAssetService = (project: IProject, testAssets: IAsset[]) => {
        const mockAssetService = AssetService as jest.Mocked<typeof AssetService>;
        mockAssetService.prototype.getAssets = jest.fn(() => Promise.resolve(testSourceAssets));

        const testAssetsMetadata = _.map(testAssets, (asset, index: number) => {
            let state: AssetState = AssetState.NotVisited;

            if (project.tags.length > 0) {
                state = index < testAssetsWithRegion ? AssetState.Tagged : AssetState.Visited;
            } else {
                state = index < testAssetsWithRegion ? AssetState.Visited : AssetState.NotVisited;
            }

            const regions = [];
            if (state === AssetState.Tagged) {
                const tagIndex = index % project.tags.length;
                const tags = [project.tags[tagIndex].name];
                for (let i = 0; i < regionsPerAsset; i++) {
                    regions.push(MockFactory.createTestRegion(asset.id, tags));
                }
            }

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
});
