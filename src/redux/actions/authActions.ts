import { ActionTypes } from "./actionTypes";
import { IPayloadAction, createPayloadAction, createAction } from "./actionCreators";
import { IAuth } from "../../models/applicationState";
import { Dispatch, Action } from "redux";

/**
 * Actions which manage users auth
 * @member signIn - Allows to sign in to the application
 * @member signOut - Allows to sign out from the application
 */
export default interface IAuthActions {
    signIn(accessToken: IAuth): Promise<void>;
    signOut(): Promise<void>;
    saveFullName(fullName: string): Promise<void>;
}

/**
 * Sign in to the application
 * @param accessToken - Auth to the application
 */
export function signIn(auth: IAuth): (dispatch: Dispatch) => Promise<void> {
    return (dispatch: Dispatch) => {
        dispatch(signInAction(auth));
        return Promise.resolve();
    };
}

/**
 * Sign out from the application
 */
export function signOut(): (dispatch: Dispatch) => Promise<void> {
    return (dispatch: Dispatch) => {
        dispatch(signOutAction());
        return Promise.resolve();
    };
}

/**
 * Save full name of the user
 */
export function saveFullName(fullName: string): (dispatch: Dispatch) => Promise<void> {
    return (dispatch: Dispatch) => {
        dispatch(saveFullNameAction(fullName));
        return Promise.resolve();
    };
}

/**
 * Sign in action type
 */
export interface ISignInAction extends IPayloadAction<string, IAuth> {
    type: ActionTypes.SIGN_IN_SUCCESS;
}

/**
 * Sign out action type
 */
export interface ISignOutAction extends Action<string> {
    type: ActionTypes.SIGN_OUT_SUCCESS;
}

/**
 * Save full name action type
 */
export interface ISaveFullNameAction extends IPayloadAction<string, string> {
    type: ActionTypes.SAVE_FULL_NAME_SUCCESS;
}

/**
 * Instance of sign in action
 */
export const signInAction = createPayloadAction<ISignInAction>(ActionTypes.SIGN_IN_SUCCESS);
/**
 * Instance of sign out action
 */
export const signOutAction = createAction<ISignOutAction>(ActionTypes.SIGN_OUT_SUCCESS);
/**
 * Instance of save full name action
 */
export const saveFullNameAction = createPayloadAction<ISaveFullNameAction>(ActionTypes.SAVE_FULL_NAME_SUCCESS);
