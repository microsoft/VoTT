import * as ActionTypes from '../actions/actionTypes';

export const applicationReducer = (state: any = {}, action: any) => {
    switch (action.type) {
        case ActionTypes.TOGGLE_DEV_TOOLS_SUCCESS:
            return { ...state, devToolsEnabled: action.value };
        case ActionTypes.REFRESH_APP_SUCCESS:
            return { ...state };
        default:
            return state;
    }
}