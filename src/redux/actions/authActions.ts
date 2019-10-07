import { ActionTypes } from "./actionTypes";
import { IPayloadAction, createPayloadAction, createAction } from "./actionCreators";
import { IAuth } from "../../models/applicationState";
import { Dispatch, Action } from "redux";

export interface IUserInfo {
    fullName: string;
    userId: number;
}

/**
 * Actions which manage users auth
 * @member signIn - Allows to sign in to the application
 * @member signOut - Allows to sign out from the application
 * @member saveUserInfo - Saves information about the user
 */
export default interface IAuthActions {
    signIn(auth: IAuth): Promise<void>;
    signOut(): Promise<void>;
    saveUserInfo(userInfo: IUserInfo): Promise<void>;
}

/**
 * Sign in to the application
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
 * Save user info
 */
export function saveUserInfo(userInfo: IUserInfo): (dispatch: Dispatch) => Promise<void> {
    return (dispatch: Dispatch) => {
        dispatch(saveUserInfoAction(userInfo));
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
 * Save user info action type
 */
export interface ISaveUserInfoAction extends IPayloadAction<string, IUserInfo> {
    type: ActionTypes.SAVE_USER_INFO_SUCCESS;
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
 * Instance of save user info action
 */
export const saveUserInfoAction = createPayloadAction<ISaveUserInfoAction>(ActionTypes.SAVE_USER_INFO_SUCCESS);
