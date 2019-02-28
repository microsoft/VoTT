import { mount, ReactWrapper } from "enzyme";
import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
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

    function createComponent(props: IProjectMetricsProps): ReactWrapper<IProjectMetricsProps, IProjectMetricsState> {
        return mount(
            <Router>
                <ProjectMetrics
                    {...props}
                />
            </Router>,
        );
    }

    beforeAll(() => {
        mockAssetService = AssetService as jest.Mocked<typeof AssetService>;
    })

    beforeEach(() => {
        testAssets = MockFactory.createTestAssets(5);
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
                (metadata) => metadata.asset === asset,
            );

            return Promise.resolve(item);
        });

        wrapper = createComponent({
            project: defaultProject,
        });
    });

    describe("project has no asset metadata", () => {

    });

    describe("project has no tags", () => {
        let project;

        beforeEach(() => {
            project = {
                ...defaultProject,
                tags: [],
            };

            wrapper = createComponent({
                project,
            });
        });

        it("still render correctly", () => {
            const tagCategoriesCount = wrapper.find("tag-categories-count");
            expect(tagCategoriesCount).toEqual(" 0 ");
        });
    });

    it("renders the component correctly", () => {
        expect(wrapper.find("list-group")).toHaveLength(1);
    });

    it("calculate state correctly", () => {
        expect(wrapper.state().sourceAssets === testAssets);
        expect(wrapper.state().projectAssetsMetadata === testAssetsMetadata);
    });

    it("correctly calculates source asset count", () => {

    });

    it("correctly calculate visited asset count", () => {

    });
});
