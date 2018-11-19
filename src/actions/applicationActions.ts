import * as ActionTypes from './actionTypes';
import { IpcRendererProxy } from '../common/ipcRendererProxy';

export interface IApplicationActions {
    toggleDevTools(show: boolean): void;
    reloadApplication(): void;
}

export function toggleDevTools(show: boolean) {
    return (dispatch) => {
        IpcRendererProxy.send('TOGGLE_DEV_TOOLS', show)
            .then(() => {
                dispatch({ type: ActionTypes.TOGGLE_DEV_TOOLS_SUCCESS, value: show });
            });
    }
}

export function reloadApplication() {
    return (dispatch) => {
        IpcRendererProxy.send('RELOAD_APP')
            .then(() => {
                dispatch({ type: ActionTypes.REFRESH_APP_SUCCESS });
            });
    }
}