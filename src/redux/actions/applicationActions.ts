import { Action, Dispatch } from "redux";
import { IpcRendererProxy } from "../../common/ipcRendererProxy";
import { ActionTypes } from "./actionTypes";
import { createPayloadAction, createAction, IPayloadAction } from "./actionCreators";

export default interface IApplicationActions {
    toggleDevTools(show: boolean): void;
    reloadApplication(): void;
}

export function toggleDevTools(show: boolean) {
    return (dispatch: Dispatch) => {
        IpcRendererProxy.send("TOGGLE_DEV_TOOLS", show)
            .then(() => {
                dispatch(toggleDevToolsAction(show));
            });
    };
}

export function reloadApplication() {
    return (dispatch: Dispatch) => {
        IpcRendererProxy.send("RELOAD_APP")
            .then(() => {
                dispatch(refreshApplicationAction());
            });
    };
}

export interface IToggleDevToolsAction extends IPayloadAction<string, boolean> {
    type: ActionTypes.TOGGLE_DEV_TOOLS_SUCCESS;
}

export interface IRefreshApplicationAction extends Action<string> {
    type: ActionTypes.REFRESH_APP_SUCCESS;
}

export const toggleDevToolsAction = createPayloadAction<IToggleDevToolsAction>(ActionTypes.TOGGLE_DEV_TOOLS_SUCCESS);
export const refreshApplicationAction = createAction<IRefreshApplicationAction>(ActionTypes.REFRESH_APP_SUCCESS);
