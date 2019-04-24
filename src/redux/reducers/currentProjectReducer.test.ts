import _ from "lodash";
import { reducer } from "./currentProjectReducer";
import { IProject, IAssetMetadata, AssetState, ITag } from "../../models/applicationState";
import MockFactory from "../../common/mockFactory";
import {
    loadProjectAction,
    saveProjectAction,
    closeProjectAction,
    deleteProjectAction,
    loadProjectAssetsAction,
    saveAssetMetadataAction,
    loadAssetMetadataAction,
} from "../actions/projectActions";
import { anyOtherAction } from "../actions/actionCreators";
import { saveConnectionAction } from "../actions/connectionActions";

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

    it("Updating connection not in use by current project performs noop", () => {
        const currentProject = MockFactory.createTestProject("1");
        const state: IProject = currentProject;
        const unrelatedConnection = MockFactory.createTestConnection("Unrelated Connection");
        const action = saveConnectionAction(unrelatedConnection);
        const result = reducer(state, action);
        expect(result).toEqual(currentProject);
    });

    it("Updating connection used by current project is updated in current project", () => {
        const currentProject = MockFactory.createTestProject("1");
        const state: IProject = currentProject;

        const updatedConnection = { ...currentProject.sourceConnection };
        updatedConnection.description += "updated";

        const action = saveConnectionAction(updatedConnection);
        const result = reducer(state, action);

        expect(result).toEqual({
            ...currentProject,
            sourceConnection: updatedConnection,
            targetConnection: updatedConnection,
        });
    });

    it("Load Project Assets does not merges assets into current asset set", () => {
        const state: IProject = MockFactory.createTestProject("TestProject");
        const testAssets = MockFactory.createTestAssets();

        const action = loadProjectAssetsAction(testAssets);
        const result = reducer(state, action);
        expect(result).toBe(state);
    });

    it("Load Asset Metadata updates project last visited asset state", () => {
        const state: IProject = MockFactory.createTestProject("TestProject");
        const testAssets = MockFactory.createTestAssets();
        state.assets = _.keyBy(testAssets, "id");

        const assetMetadata = MockFactory.createTestAssetMetadata(testAssets[0]);

        const action = loadAssetMetadataAction(assetMetadata);
        const result = reducer(state, action);
        expect(result).not.toBe(state);
        expect(result.lastVisitedAssetId).toEqual(assetMetadata.asset.id);
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
            version: "",
        };

        const action = saveAssetMetadataAction(assetMetadata);
        const result = reducer(state, action);
        expect(result).not.toBe(state);
        expect(result.assets[testAssets[0].id]).toEqual(assetMetadata.asset);
    });

    it("Appends new tags to project when saving asset contains new tags", () => {
        const state: IProject = MockFactory.createTestProject("TestProject");
        const testAssets = MockFactory.createTestAssets();

        const expectedTag: ITag = {
            name: "NEWTAG",
            color: expect.any(String),
        };

        const assetMetadata = MockFactory.createTestAssetMetadata(
            testAssets[0],
            [MockFactory.createTestRegion("Region 1", [expectedTag.name])],
        );

        const action = saveAssetMetadataAction(assetMetadata);
        const result = reducer(state, action);
        expect(result).not.toBe(state);
        expect(result.tags).toEqual([
            ...state.tags,
            expectedTag,
        ]);
    });

    it("Unknown action performs a noop", () => {
        const state: IProject = MockFactory.createTestProject("TestProject");
        const action = anyOtherAction();

        const result = reducer(state, action);
        expect(result).toBe(state);
    });
});
