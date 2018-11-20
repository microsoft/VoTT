import * as ActionTypes from './actionTypes';
import { IProject } from "../store/applicationState";

export default interface IProjectActions {
    loadProject(project: IProject);
    saveProject(project: IProject);
    closeProject();
}

export function loadProject(project: IProject) {
    return (dispatch) => {
        dispatch({ type: ActionTypes.LOAD_PROJECT_SUCCESS, project: project });
    };
}

export function saveProject(project: IProject){
    return (dispatch) => {
        // TODO - Save the actual file to storage provider
        dispatch({ type: ActionTypes.SAVE_PROJECT_SUCCESS, project: project });
    };
}

export function closeProject() {
    return (dispatch) => {
        dispatch({ type: ActionTypes.CLOSE_PROJECT_SUCCESS });
    }
}