import ProjectService from "../services/projectService";
import { IProject } from "../store/applicationState";
import * as ActionTypes from "./actionTypes";

const projectService = new ProjectService();

export default interface IProjectActions {
    loadProjects(): Promise<IProject[]>;
    loadProject(projectId: string): Promise<IProject>;
    loadProject(project: IProject): Promise<IProject>;
    saveProject(project: IProject): Promise<IProject>;
    deleteProject(project: IProject): Promise<void>;
    closeProject();
}

export function loadProject(value: string | IProject) {
    return async (dispatch) => {
        try {
            let project: IProject = value as IProject;

            if (typeof (value) === 'string') {
                project = await projectService.get(value);
            }

            dispatch({ type: ActionTypes.LOAD_PROJECT_SUCCESS, project: project });

            return project;
        }
        catch (err) {
            throw err;
        }
    }
}

export function loadProjects() {
    return async (dispatch) => {
        const projects = await projectService.getList();
        dispatch({ type: ActionTypes.LOAD_PROJECTS_SUCCESS, projects });

        return projects;
    };
}

export function saveProject(project: IProject) {
    return async (dispatch) => {
        project = await projectService.save(project);
        dispatch({ type: ActionTypes.SAVE_PROJECT_SUCCESS, project });
        dispatch({ type: ActionTypes.LOAD_PROJECT_SUCCESS, project });

        return project;
    };
}

export function deleteProject(project: IProject) {
    return async (dispatch) => {
        await projectService.delete(project);
        dispatch({ type: ActionTypes.DELETE_PROJECT_SUCCESS, project });
    };
}

export function closeProject() {
    return (dispatch) => {
        dispatch({ type: ActionTypes.CLOSE_PROJECT_SUCCESS });
    };
}
