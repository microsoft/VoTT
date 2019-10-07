import { Dispatch } from "redux";
import { createPayloadAction, IPayloadAction } from "./actionCreators";
import { ActionTypes } from "./actionTypes";
import { ITrackingAction, TrackingActionType, createTrackingAction } from "../../models/trackingAction";
import { IRegion } from "../../models/applicationState";

/**
 * Actions which manage tracking
 * @member trackingSignIn - Tracks user signs in to the app
 * @member trackingSignOut - Tracks user signs out from the app
 * @member trackingImgIn - Tracks user enters on the image
 * @member trackingImgOut - Tracks user leaves the image
 * @member trackingImgDelete - Tracks user deletes the image
 */
export default interface ITrackingActions {
    trackingSignIn(userId: number): Promise<void>;
    trackingSignOut(userId: number): Promise<void>;
    trackingImgIn(userId: number, imageId: string, regions: IRegion[]): Promise<void>;
    trackingImgOut(userId: number, imageId: string, regions: IRegion[]): Promise<void>;
    trackingImgDelete(userId: number, imageId: string): Promise<void>;
}

/**
 * Tracks user signs in to the application
 */
export function trackingSignIn(userId: number): (dispatch: Dispatch) => Promise<void> {
    return (dispatch: Dispatch) => {
        const trackingAction = createTrackingAction(TrackingActionType.SignIn, userId);
        dispatch(trackingSignInAction(trackingAction));
        return Promise.resolve();
    };
}

/**
 * Tracks user signs out from the application
 */
export function trackingSignOut(userId: number): (dispatch: Dispatch) => Promise<void> {
    return (dispatch: Dispatch) => {
        const trackingAction = createTrackingAction(TrackingActionType.SignOut, userId);
        dispatch(trackingSignOutAction(trackingAction));
        return Promise.resolve();
    };
}

/**
 * Tracks user enters on the image
 */
export function trackingImgIn(userId: number, imageId: string, regions: IRegion[])
: (dispatch: Dispatch) => Promise<void> {
    return (dispatch: Dispatch) => {
        const trackingAction = createTrackingAction(TrackingActionType.ImgIn, userId, imageId, regions);
        dispatch(trackingImgInAction(trackingAction));
        return Promise.resolve();
    };
}

/**
 * Tracks user leaves the image
 */
export function trackingImgOut(userId: number, imageId: string, regions: IRegion[])
: (dispatch: Dispatch) => Promise<void> {
    return (dispatch: Dispatch) => {
        const trackingAction = createTrackingAction(TrackingActionType.ImgOut, userId, imageId, regions);
        dispatch(trackingImgOutAction(trackingAction));
        return Promise.resolve();
    };
}

/**
 * Tracks user deletes the image
 */
export function trackingImgDelete(userId: number, imageId: string): (dispatch: Dispatch) => Promise<void> {
    return (dispatch: Dispatch) => {
        const trackingAction = createTrackingAction(TrackingActionType.ImgDelete, userId, imageId);
        dispatch(trackingImgDeleteAction(trackingAction));
        return Promise.resolve();
    };
}

export interface ITrackingSignInAction extends IPayloadAction<string, ITrackingAction> {
    type: ActionTypes.TRACK_SIGN_IN_SUCCESS;
}

export interface ITrackingSignOutAction extends IPayloadAction<string, ITrackingAction> {
    type: ActionTypes.TRACK_SIGN_OUT_SUCCESS;
}

export interface ITrackingImgInAction extends IPayloadAction<string, ITrackingAction> {
    type: ActionTypes.TRACK_IMG_IN_SUCCESS;
}

export interface ITrackingImgOutAction extends IPayloadAction<string, ITrackingAction> {
    type: ActionTypes.TRACK_IMG_OUT_SUCCESS;
}

export interface ITrackingImgDeleteAction extends IPayloadAction<string, ITrackingAction> {
    type: ActionTypes.TRACK_IMG_DELETE_SUCCESS;
}

export const trackingSignInAction = createPayloadAction<ITrackingSignInAction>(ActionTypes.TRACK_SIGN_IN_SUCCESS);
export const trackingSignOutAction = createPayloadAction<ITrackingSignOutAction>(ActionTypes.TRACK_SIGN_OUT_SUCCESS);
export const trackingImgInAction = createPayloadAction<ITrackingImgInAction>(ActionTypes.TRACK_IMG_IN_SUCCESS);
export const trackingImgOutAction = createPayloadAction<ITrackingImgOutAction>(ActionTypes.TRACK_IMG_OUT_SUCCESS);
export const trackingImgDeleteAction = createPayloadAction<ITrackingImgDeleteAction>(ActionTypes.TRACK_IMG_DELETE_SUCCESS); // tslint:disable-line
