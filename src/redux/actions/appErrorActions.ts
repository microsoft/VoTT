import { Dispatch, Action } from "redux";
import { IAppError } from "../../models/applicationState";
import { createPayloadAction, IPayloadAction, createAction } from "./actionCreators";
import { ActionTypes } from "./actionTypes";

/**
 * Action to display alert when there's an error in the app
 * @member showError
 * @member clearError
 * @interface
 */
export default interface IAppErrorActions {
    showError(appError: IAppError): void;
    clearError(): void;
}

/**
 * show alert popup to indicate error
 * @param appError {IAppError} the error to display in alert
 * @returns {(dispatch: Dispatch) => void}
 */
export function showError(appError: IAppError): (dispatch: Dispatch) => void {
    return (dispatch: Dispatch) => {
        dispatch(showErrorAction(appError));
    };
}

/**
 * clear alert popup
 * @returns {(dispatch: Dispatch) => void}
 */
export function clearError(): (dispatch: Dispatch) => void {
    return (dispatch: Dispatch) => {
        dispatch(clearErrorAction());
    };
}

/**
 * Show error action type
 */
export interface IShowAppErrorAction extends IPayloadAction<string, IAppError> {
    type: ActionTypes.SHOW_ERROR;
}

/**
 * Clear error action type
 */
export interface IClearErrorAction extends Action<string> {
    type: ActionTypes.CLEAR_ERROR;
}

/**
 * Instance of show error action
 */
export const showErrorAction = createPayloadAction<IShowAppErrorAction>(ActionTypes.SHOW_ERROR);

/**
 * Instance of clear error action
 * @type {() => Action<IClearErrorAction["type"]>}
 */
export const clearErrorAction = createAction<IClearErrorAction>(ActionTypes.CLEAR_ERROR);
