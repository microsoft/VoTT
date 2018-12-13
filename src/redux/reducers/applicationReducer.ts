import { ActionTypes } from "../actions/actionTypes";
import { IAppSettings } from "../../models/applicationState";
import { AnyAction } from "../actions/actionCreators";

export const reducer = (state: IAppSettings = null, action: AnyAction): IAppSettings => {
    switch (action.type) {
        case ActionTypes.TOGGLE_DEV_TOOLS_SUCCESS:
            return { ...state, devToolsEnabled: action.payload };
        case ActionTypes.REFRESH_APP_SUCCESS:
            return { ...state };
        default:
            return state;
    }
};
