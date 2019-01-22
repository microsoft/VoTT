import { ActionTypes } from "../actions/actionTypes";
import { IAppSettings } from "../../models/applicationState";
import { AnyAction } from "../actions/actionCreators";

/**
 * Reducer for application settings. Actions handled:
 * TOGGLE_DEV_TOOLS_SUCCESS
 * REFRESH_APP_SUCCESS
 * @param state - Current app settings
 * @param action - Action that was dispatched
 */
export const reducer = (state: IAppSettings = null, action: AnyAction): IAppSettings => {
    switch (action.type) {
        case ActionTypes.TOGGLE_DEV_TOOLS_SUCCESS:
            return { ...state, devToolsEnabled: action.payload };
        case ActionTypes.REFRESH_APP_SUCCESS:
            return { ...state };
        case ActionTypes.SAVE_APP_SETTINGS_SUCCESS:
            return { ...action.payload };
        default:
            return state;
    }
};
