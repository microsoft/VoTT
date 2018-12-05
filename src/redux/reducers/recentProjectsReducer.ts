import * as ActionTypes from "../actions/actionTypes";
import { IProject } from "../../models/applicationState";

export const reducer = (state: IProject[] = [], action: any) => {
    switch (action.type) {
        case ActionTypes.LOAD_PROJECTS_SUCCESS:
            return [...action.projects];
        case ActionTypes.LOAD_PROJECT_SUCCESS:
        case ActionTypes.SAVE_PROJECT_SUCCESS:
            if (state) {
                return [
                    { ...action.project },
                    ...state.filter((project) => project.id !== action.project.id),
                ];
            } else {
                return [{ ...action.project }];
            }
        case ActionTypes.DELETE_PROJECT_SUCCESS:
            return [...state.filter((project) => project.id !== action.project.id)];
        default:
            return state;
    }
};
