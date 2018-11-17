import * as ActionTypes from './actionTypes';

export interface IApplicationActions {
    toggleDevTools(show: boolean): void;
    reloadApplication(): void;
}

export function toggleDevTools(show: boolean) {
    return (dispatch) => {
        const { ipcRenderer } = (<any>window).require('electron');
        ipcRenderer.send('TOGGLE_DEV_TOOLS', show);
        dispatch({ type: ActionTypes.TOGGLE_DEV_TOOLS_SUCCESS, value: show });
    }
}

export function reloadApplication() {
    return (dispatch) => {
        const { ipcRenderer } = (<any>window).require('electron');
        ipcRenderer.send('RELOAD_APP');
        dispatch({ type: ActionTypes.REFRESH_APP_SUCCESS });
    }
}