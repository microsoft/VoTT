import { ActionTypes } from "../actions/actionTypes";
import { AnyAction } from "../actions/actionCreators";
import { IAppError } from "../../models/applicationState";

/**
 * App Error Reducer
 * Actions handled:
 *  SHOW_ERROR
 *  CLEAR_ERROR
 * @param {IAppError} state
 * @param {AnyAction} action
 * @returns {any}
 */
export const reducer = (state: IAppError = null, action: AnyAction) => {
    switch (action.type) {
        case ActionTypes.SHOW_ERROR:
            return {...action.payload};
        case ActionTypes.CLEAR_ERROR:
            return null;
        default:
            return state;
    }
};
