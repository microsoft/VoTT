import { Action } from "redux";
import { IToggleDevToolsAction, IRefreshApplicationAction, ISaveAppSettingsAction } from "./applicationActions";
import { ActionTypes } from "./actionTypes";
import {
    ILoadConnectionAction,
    ISaveConnectionAction,
    IDeleteConnectionAction,
} from "./connectionActions";
import {
    ILoadProjectAction,
    ICloseProjectAction,
    ISaveProjectAction,
    ILoadProjectAssetsAction,
    ISaveAssetMetadataAction,
    ILoadAssetMetadataAction,
    IExportProjectAction,
    IDeleteProjectAction,
} from "./projectActions";
import {
    IShowAppErrorAction,
    IClearErrorAction,
} from "./appErrorActions";

/**
 * Data payload dispatched from the action and delivered to reducer
 */
export interface IPayloadAction<TType, TPayload> extends Action<TType> {
    payload: TPayload;
}

/**
 * Creates action and validates type of action type name
 * @param type Name for action being created
 */
// tslint:disable-next-line:max-line-length
export function createAction<TAction extends Action<TAction["type"]>>(type: TAction["type"]): () => Action<TAction["type"]> {
    return () => ({
        type,
    });
}

/**
 * Create action with payload
 * @param type Name for action being created
 */
// tslint:disable-next-line:max-line-length
export function createPayloadAction<TAction extends IPayloadAction<TAction["type"], TAction["payload"]>>(type: TAction["type"]): (payload: TAction["payload"]) => IPayloadAction<TAction["type"], TAction["payload"]> {
    return (payload: TAction["payload"]) => ({
        type,
        payload,
    });
}

/**
 * Catch-all for unregistered actions
 */
export interface IOtherAction extends Action<string> {
    type: ActionTypes.ANY_OTHER_ACTION;
}

/**
 * Helper instance of catch-all
 */
export const anyOtherAction = createAction<IOtherAction>(ActionTypes.ANY_OTHER_ACTION);

/**
 * Used by reducers to type-check all actions
 */
export type AnyAction = IOtherAction |
    IToggleDevToolsAction |
    IRefreshApplicationAction |
    ISaveAppSettingsAction |
    ILoadConnectionAction |
    ISaveConnectionAction |
    IDeleteConnectionAction |
    ILoadProjectAction |
    ICloseProjectAction |
    ISaveProjectAction |
    IDeleteProjectAction |
    ILoadProjectAssetsAction |
    ISaveAssetMetadataAction |
    ILoadAssetMetadataAction |
    IExportProjectAction |
    IShowAppErrorAction |
    IClearErrorAction;
