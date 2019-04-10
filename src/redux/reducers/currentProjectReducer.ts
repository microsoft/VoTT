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
        case ActionTypes.LOAD_ASSET_METADATA_SUCCESS:
            if (!state) {
                return state;
            }

            return {
                ...state,
                lastVisitedAssetId: action.payload.asset.id,
            };
        case ActionTypes.SAVE_ASSET_METADATA_SUCCESS:
            if (!state) {
                return state;
            }

            const updatedAssets = { ...state.assets } || {};
            updatedAssets[action.payload.asset.id] = { ...action.payload.asset };

            return {
                ...state,
                assets: updatedAssets,
            };
        case ActionTypes.SAVE_CONNECTION_SUCCESS:
            if (!state) {
                return state;
            }

            return {
                ...state,
                sourceConnection: state.sourceConnection.id === action.payload.id
                    ? { ...action.payload }
                    : state.sourceConnection,
                targetConnection: state.targetConnection.id === action.payload.id
                    ? { ...action.payload }
                    : state.targetConnection,
            };
        default:
            return state;
    }
};
