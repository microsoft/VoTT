import _ from "lodash";
import { reducer } from "./currentProjectReducer";
import { IProject, IAssetMetadata, AssetState } from "../../models/applicationState";
import * as ActionTypes from "../actions/actionTypes";
import MockFactory from "../../common/mockFactory";

describe("Current Project Reducer", () => {
    it("LOAD_PROJECT_ASSETS merges assets into current asset set", () => {
        const state: IProject = MockFactory.createTestProject();
        const testAssets = MockFactory.createTestAssets();

        const action = {
            type: ActionTypes.LOAD_PROJECT_ASSETS_SUCCESS,
            assets: testAssets,
        };

        const result = reducer(state, action);
        expect(result).not.toBe(state);
        expect(Object.keys(result.assets).length).toEqual(testAssets.length);
    });

    it("SAVE_ASSET_METADATA_SUCCESS updates project asset state", () => {
        const state: IProject = MockFactory.createTestProject();
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

        const action = {
            type: ActionTypes.SAVE_ASSET_METADATA_SUCCESS,
            assetMetadata,
        };

        const result = reducer(state, action);
        expect(result).not.toBe(state);
        expect(result.assets[testAssets[0].id]).toEqual(assetMetadata.asset);
    });
});
