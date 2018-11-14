import * as ActionTypes from './actionTypes';

function toggleDevToolsSuccess(menuItem: any) {
    return { type: ActionTypes.TOGGLE_DEV_TOOLS_SUCCESS, menuItem };
}

function openLocalFolderSuccess(result: any) {
    return { type: ActionTypes.OPEN_LOCAL_FOLDER_SUCCESS, result };
}

export function toggleDevTools(menuItem: any, browserWindow: any) {
    return (dispatch) => {
        if (menuItem.checked) {
            browserWindow.webContents.openDevTools();
        } else {
            browserWindow.webContents.closeDevTools();
        }

        dispatch(toggleDevToolsSuccess(menuItem));
    }
}

export function openLocalFolder(menuItem: any) {
    return (dispatch) => {
        const { dialog } = require('electron');
        dialog.showOpenDialog({
            title: 'Open Images Directory',
            properties: ['openDirectory'],
        },
            (result: any) => {
                dispatch(openLocalFolderSuccess(result));
            });
    };
}