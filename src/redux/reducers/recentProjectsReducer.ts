import _ from "lodash";
import * as ActionTypes from "../actions/actionTypes";
import { IProject } from "../../models/applicationState";

export const reducer = (state: IProject[] = [], action: any): IProject[] => {
    if (!state) {
        state = [];
    }

    let newState: IProject[] = null;

    switch (action.type) {
        case ActionTypes.LOAD_PROJECTS_SUCCESS:
            newState = _.unionBy(state, action.projects, (project) => project.id);
            localStorage.setItem("projects", JSON.stringify(newState));
            return newState;
        case ActionTypes.LOAD_PROJECT_SUCCESS:
        case ActionTypes.SAVE_PROJECT_SUCCESS:
            return [
                { ...action.project },
                ...state.filter((project) => project.id !== action.project.id),
            ];
        case ActionTypes.DELETE_PROJECT_SUCCESS:
            return [...state.filter((project) => project.id !== action.project.id)];
        case ActionTypes.SAVE_CONNECTION_SUCCESS:
            newState = state.map((project) => {
                const updatedProject = { ...project };
                if (project.sourceConnection.id === action.connection.id) {
                    updatedProject.sourceConnection = { ...action.connection };
                }
                if (project.targetConnection.id === action.connection.id) {
                    updatedProject.targetConnection = { ...action.connection };
                }
                return updatedProject;
            });
            localStorage.setItem("projects", JSON.stringify(newState));
            return newState;
        default:
            return state;
    }
};
