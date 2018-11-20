import * as ActionTypes from '../actions/actionTypes';
import { IProject } from "../store/applicationState";

export const reducer = (state: IProject[] = [], action: any) => {
    switch (action.type) {
        case ActionTypes.SAVE_PROJECT_SUCCESS:
            return [
                ...state.filter(project => project.id !== action.project.id), Object.assign({}, action.project)
            ];
        default:
            return state;
    }
}
