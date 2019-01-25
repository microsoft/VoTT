import _ from "lodash";
import { reducer } from "./currentProjectReducer";
import { IProject, IAssetMetadata, AssetState } from "../../models/applicationState";
import MockFactory from "../../common/mockFactory";
import {
    loadProjectAction,
    saveProjectAction,
    closeProjectAction,
    deleteProjectAction,
    loadProjectAssetsAction,
    saveAssetMetadataAction,
} from "../actions/projectActions";
import { anyOtherAction } from "../actions/actionCreators";

describe("Current Project Reducer", () => {
    it("Load project sets current project state", () => {
        const testProject = MockFactory.createTestProject("TestProject");
        const state: IProject = null;

        const action = loadProjectAction(testProject);
        const result = reducer(state, action);
        expect(result).not.toBe(state);
        expect(result).toEqual(testProject);
    });

    it("Close project clears out current project", () => {
        const currentProject = MockFactory.createTestProject("1");
        const state: IProject = currentProject;
        const action = closeProjectAction();
        const result = reducer(state, action);
        expect(result).toBeNull();
    });

    it("Delete project clears out currnet project", () => {
        const currentProject = MockFactory.createTestProject("1");
        const state: IProject = currentProject;
        const action = deleteProjectAction(currentProject);
        const result = reducer(state, action);
        expect(result).toBeNull();
    });

    it("Load Project Assets merges assets into current asset set", () => {
        const state: IProject = MockFactory.createTestProject("TestProject");
        const testAssets = MockFactory.createTestAssets();

        const action = loadProjectAssetsAction(testAssets);
        const result = reducer(state, action);
        expect(result).not.toBe(state);
        expect(Object.keys(result.assets).length).toEqual(testAssets.length);
    });

    it("Save Asset Metadata updates project asset state", () => {
        const state: IProject = MockFactory.createTestProject("TestProject");
        const testAssets = MockFactory.createTestAssets();
        state.assets = _.keyBy(testAssets, "id");

        const assetMetadata: IAssetMetadata = {
            asset: {
                ...testAssets[0],
                state: AssetState.Visited,
                size: {
                    width: 1024,
                    height: 768,
                },
            },
            regions: [],
            timestamp: null,
        };

        const action = saveAssetMetadataAction(assetMetadata);
        const result = reducer(state, action);
        expect(result).not.toBe(state);
        expect(result.assets[testAssets[0].id]).toEqual(assetMetadata.asset);
    });

    it("Unknown action performs a noop", () => {
        const state: IProject = MockFactory.createTestProject("TestProject");
        const action = anyOtherAction();

        const result = reducer(state, action);
        expect(result).toBe(state);
    });
});
