import * as ActionTypes from '../actions/actionTypes';
import { IProject } from "../store/applicationState";

export const reducer = (state: IProject = null, action: any) => {
    switch (action.type) {
        case ActionTypes.CLOSE_PROJECT_SUCCESS:
            return null;
        case ActionTypes.LOAD_PROJECT_SUCCESS:
            return { ...action.project };
        case ActionTypes.SAVE_PROJECT_SUCCESS:
            if (state.id === action.project.id) {
                return { ...action.project };
            } else {
                return state;
            }
        default:
            return state;
    }
}
