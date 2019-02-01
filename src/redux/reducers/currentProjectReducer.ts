import _ from "lodash";
import { ActionTypes } from "../actions/actionTypes";
import { IProject } from "../../models/applicationState";
import { AnyAction } from "../actions/actionCreators";

/**
 * Reducer for project. Actions handled:
 * DELETE_PROJECT_SUCCESS
 * CLOSE_PROJECT_SUCCESS
 * LOAD_PROJECT_SUCCESS
 * SAVE_PROJECT_SUCCESS
 * LOAD_PROJECT_ASSETS_SUCCESS
 * SAVE_ASSET_METADATA_SUCCESS
 * @param state - Current project
 * @param action - Action that was dispatched
 */
export const reducer = (state: IProject = null, action: AnyAction): IProject => {
    switch (action.type) {
        case ActionTypes.DELETE_PROJECT_SUCCESS:
        case ActionTypes.CLOSE_PROJECT_SUCCESS:
            return null;
        case ActionTypes.LOAD_PROJECT_SUCCESS:
            return { ...action.payload };
        case ActionTypes.LOAD_PROJECT_ASSETS_SUCCESS:
            if (state) {
                const currentAssets = { ...state.assets } || {};
                action.payload.forEach((asset) => {
                    if (!currentAssets[asset.id]) {
                        currentAssets[asset.id] = asset;
                    }
                });

                return {
                    ...state,
                    assets: currentAssets,
                };
            } else {
                return state;
            }
        case ActionTypes.SAVE_ASSET_METADATA_SUCCESS:
            if (state) {
                const updatedAssets = { ...state.assets } || {};
                updatedAssets[action.payload.asset.id] = { ...action.payload.asset };

                return {
                    ...state,
                    assets: updatedAssets,
                };
            } else {
                return state;
            }
        default:
            return state;
    }
};
