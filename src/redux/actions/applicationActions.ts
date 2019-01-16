import { Action, Dispatch } from "redux";
import { IpcRendererProxy } from "../../common/ipcRendererProxy";
import { ActionTypes } from "./actionTypes";
import { createPayloadAction, createAction, IPayloadAction } from "./actionCreators";

/**
 * Actions to make changes to application settings
 * @member toggleDevTools - Open or close dev tools
 * @member reloadApplication - Reload application
 */
export default interface IApplicationActions {
    toggleDevTools(show: boolean): void;
    reloadApplication(): void;
}

/**
 * Open or close dev tools
 * @param show - Dev tools is open
 */
export function toggleDevTools(show: boolean): (dipatch: Dispatch) => Promise<void> {
    return (dispatch: Dispatch) => {
        return IpcRendererProxy.send("TOGGLE_DEV_TOOLS", show)
            .then(() => {
                dispatch(toggleDevToolsAction(show));
            });
    };
}

/**
 * Reload application
 */
export function reloadApplication(): (dipatch: Dispatch) => Promise<void> {
    return (dispatch: Dispatch) => {
        return IpcRendererProxy.send("RELOAD_APP")
            .then(() => {
                dispatch(refreshApplicationAction());
            });
    };
}

/**
 * Toggle Dev Tools Redux Action type
 */
export interface IToggleDevToolsAction extends IPayloadAction<string, boolean> {
    type: ActionTypes.TOGGLE_DEV_TOOLS_SUCCESS;
}

/**
 * Refresh app action type
 */
export interface IRefreshApplicationAction extends Action<string> {
    type: ActionTypes.REFRESH_APP_SUCCESS;
}

/**
 * Instance of toggle dev tools action
 */
export const toggleDevToolsAction = createPayloadAction<IToggleDevToolsAction>(ActionTypes.TOGGLE_DEV_TOOLS_SUCCESS);
/**
 * Instance of refresh app action
 */
export const refreshApplicationAction = createAction<IRefreshApplicationAction>(ActionTypes.REFRESH_APP_SUCCESS);
