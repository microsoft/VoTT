import _ from "lodash";
import * as ActionTypes from "../actions/actionTypes";
import { IProject } from "../../models/applicationState";
import deepmerge from "deepmerge";

export const reducer = (state: IProject = null, action: any) => {
    switch (action.type) {
        case ActionTypes.DELETE_PROJECT_SUCCESS:
        case ActionTypes.CLOSE_PROJECT_SUCCESS:
            return null;
        case ActionTypes.LOAD_PROJECT_SUCCESS:
            return { ...action.project };
        case ActionTypes.SAVE_PROJECT_SUCCESS:
            if (state && state.id === action.project.id) {
                return { ...action.project };
            } else {
                return state;
            }
        case ActionTypes.LOAD_PROJECT_ASSETS_SUCCESS:
            if (state) {
                return deepmerge(state, { assets: _.keyBy(action.assets, "id") });
            } else {
                return state;
            }
        case ActionTypes.SAVE_ASSET_SUCCESS:
            if (state) {
                const updatedAssets = { ...state.assets } || {};
                updatedAssets[action.asset.id] = { ...action.asset };
                return { ...state, assets: updatedAssets };
            } else {
                return state;
            }
        default:
            return state;
    }
};
