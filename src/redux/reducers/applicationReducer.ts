import * as ActionTypes from "../actions/actionTypes";
import { IAppSettings } from "../../models/applicationState";

export const reducer = (state: IAppSettings = null, action: any): IAppSettings => {
    switch (action.type) {
        case ActionTypes.TOGGLE_DEV_TOOLS_SUCCESS:
            return { ...state, devToolsEnabled: action.value };
        case ActionTypes.REFRESH_APP_SUCCESS:
            return { ...state };
        default:
            return state;
    }
};
