import { Dispatch, Action } from "redux";
import { IAppError } from "../../models/applicationState";
import { createPayloadAction, IPayloadAction, createAction } from "./actionCreators";
import { ActionTypes } from "./actionTypes";

export default interface IAppErrorActions {
    showError(appError: IAppError): void;
    clearError(): void;
}

export function showError(appError: IAppError): (dispatch: Dispatch) => void {
    return (dispatch: Dispatch) => {
        dispatch(showErrorAction(appError));
    };
}

export function clearError(): (dispatch: Dispatch) => void {
    return (dispatch: Dispatch) => {
        dispatch(clearErrorAction());
    };
}

export interface IShowAppErrorAction extends IPayloadAction<string, IAppError> {
    type: ActionTypes.SHOW_ERROR;
}

export interface IClearErrorAction extends Action<string> {
    type: ActionTypes.CLEAR_ERROR;
}

export const showErrorAction = createPayloadAction<IShowAppErrorAction>(ActionTypes.SHOW_ERROR);
export const clearErrorAction = createAction<IClearErrorAction>(ActionTypes.CLEAR_ERROR);
