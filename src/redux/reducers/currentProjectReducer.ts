import _ from "lodash";
import { ActionTypes } from "../actions/actionTypes";
import { IProject, ITag } from "../../models/applicationState";
import { AnyAction } from "../actions/actionCreators";
// tslint:disable-next-line:no-var-requires
const tagColors = require("../../react/components/common/tagColors.json");

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

            const assetTags = new Set();
            action.payload.regions.forEach((region) => region.tags.forEach((tag) => assetTags.add(tag)));

            const newTags: ITag[] = state.tags ? [...state.tags] : [];
            let updateTags = false;

            assetTags.forEach((tag: string) => {
                if (!state.tags || state.tags.length === 0 ||
                    !state.tags.find((projectTag) => tag === projectTag.name)) {
                    newTags.push({
                        name: tag,
                        color: tagColors[newTags.length % tagColors.length],
                    });
                    updateTags = true;
                }
            });

            if (updateTags) {
                return {
                    ...state,
                    tags: newTags,
                    assets: updatedAssets,
                };
            }

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
