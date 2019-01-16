import { ActionTypes } from "../actions/actionTypes";
import { AnyAction } from "../actions/actionCreators";
import { IAppError } from "../../models/applicationState";

export const reducer = (state: IAppError = null, action: AnyAction) => {
    switch (action.type) {
        case ActionTypes.SHOW_ERROR:
            return {...action.payload};
        case ActionTypes.CLEAR_ERROR:
            return null;
        // Default
        default:
            return state;
    }
};
