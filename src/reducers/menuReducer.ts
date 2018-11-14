import * as ActionTypes from '../actions/actionTypes';

export const menuReducer = (state = {}, action: any) => {
    switch (action.type) {
        case ActionTypes.TOGGLE_DEV_TOOLS_SUCCESS:
            return (<any>Object).assign({}, state, { devToolsEnabled: action.menuItem.checked });
        case ActionTypes.OPEN_LOCAL_FOLDER_SUCCESS:
            return (<any>Object).assign({}, state, { openLocalFolder: true });
        default:
            return state;
    }
}

function openLocalFolder(menuItem: any) {
    const { dialog } = require('electron');
    return dialog.showOpenDialog({
        title: 'Open Images Directory',
        properties: ['openDirectory']
    });
}

function toggleDevTools(menuItem: any, browserWindow: any) {
    if (menuItem.checked) {
        browserWindow.webContents.openDevTools();
    } else {
        browserWindow.webContents.closeDevTools();
    }
}