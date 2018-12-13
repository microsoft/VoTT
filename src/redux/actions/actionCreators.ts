import { Action } from "redux";
import { IToggleDevToolsAction, IRefreshApplicationAction } from "./applicationActions";
import {
    ILoadConnectionAction,
    ILoadConnectionsAction,
    ISaveConnectionAction,
    IDeleteConnectionAction,
} from "./connectionActions";
import {
    ILoadProjectAction,
    ICloseProjectAction,
    ILoadProjectsAction,
    ISaveProjectAction,
    ILoadProjectAssetsAction,
    ISaveAssetMetadataAction,
    ILoadAssetMetadataAction,
    IExportProjectAction,
    IDeleteProjectAction,
} from "./projectActions";
import { ActionTypes } from "./actionTypes";

export interface IPayloadAction<TType, TPayload> extends Action<TType> {
    payload: TPayload;
}

// tslint:disable-next-line:max-line-length
export function createAction<TAction extends Action<TAction["type"]>>(type: TAction["type"]): () => Action<TAction["type"]> {
    return () => ({
        type,
    });
}

// tslint:disable-next-line:max-line-length
export function createPayloadAction<TAction extends IPayloadAction<TAction["type"], TAction["payload"]>>(type: TAction["type"]): (payload: TAction["payload"]) => IPayloadAction<TAction["type"], TAction["payload"]> {
    return (payload: TAction["payload"]) => ({
        type,
        payload,
    });
}

export interface IOtherAction extends Action<string> {
    type: ActionTypes.ANY_OTHER_ACTION;
}

export const anyOtherAction = createAction<IOtherAction>(ActionTypes.ANY_OTHER_ACTION);

export type AnyAction = IOtherAction |
    IToggleDevToolsAction |
    IRefreshApplicationAction |
    ILoadConnectionAction |
    ILoadConnectionsAction |
    ISaveConnectionAction |
    IDeleteConnectionAction |
    ILoadProjectAction |
    ILoadProjectsAction |
    ICloseProjectAction |
    ISaveProjectAction |
    IDeleteProjectAction |
    ILoadProjectAssetsAction |
    ISaveAssetMetadataAction |
    ILoadAssetMetadataAction |
    IExportProjectAction;
