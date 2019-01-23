import _ from "lodash";
import { ActionTypes } from "../actions/actionTypes";
import { IProject } from "../../models/applicationState";
import { AnyAction } from "../actions/actionCreators";

/**
 * Reducer for recent projects. Actions handled:
 * LOAD_PROJECT_SUCCESS
 * SAVE_PROJECT_SUCCESS
 * DELETE_PROJECT_SUCCESS
 * SAVE_CONNECTION_SUCCESS
 * @param state - Array of recent projects
 * @param action - Action that was dispatched
 */
export const reducer = (state: IProject[] = [], action: AnyAction): IProject[] => {
    if (!state) {
        state = [];
    }

    let newState: IProject[] = null;

    switch (action.type) {
        case ActionTypes.SAVE_PROJECT_SUCCESS:
            return [
                { ...action.payload },
                ...state.filter((project) => project.id !== action.payload.id),
            ];
        case ActionTypes.DELETE_PROJECT_SUCCESS:
            return [...state.filter((project) => project.id !== action.payload.id)];
        case ActionTypes.SAVE_CONNECTION_SUCCESS:
            newState = state.map((project) => {
                const updatedProject = { ...project };
                if (project.sourceConnection.id === action.payload.id) {
                    updatedProject.sourceConnection = { ...action.payload };
                }
                if (project.targetConnection.id === action.payload.id) {
                    updatedProject.targetConnection = { ...action.payload };
                }
                return updatedProject;
            });
            return newState;
        default:
            return state;
    }
};
