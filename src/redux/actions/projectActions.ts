import ProjectService from "../../services/projectService";
import { IProject, IAsset } from "../../models/applicationState";
import * as ActionTypes from "./actionTypes";
import { AssetProviderFactory } from "../../providers/storage/assetProvider";

const projectService = new ProjectService();

export default interface IProjectActions {
    loadProjects(): Promise<IProject[]>;
    loadProject(value: IProject | string): Promise<IProject>;
    saveProject(project: IProject): Promise<IProject>;
    deleteProject(project: IProject): Promise<void>;
    closeProject();
    loadAssets(project: IProject): Promise<IAsset[]>;
    saveAsset(asset: IAsset): IAsset;
}

export function loadProject(value: string | IProject) {
    return async (dispatch) => {
        try {
            let project: IProject = value as IProject;

            if (typeof (value) === "string") {
                project = await projectService.get(value);
            }

            dispatch({ type: ActionTypes.LOAD_PROJECT_SUCCESS, project });

            return project;
        } catch (err) {
            throw err;
        }
    };
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

export function loadAssets(project: IProject) {
    return async (dispatch) => {
        const assetProvider = AssetProviderFactory.create(
            project.sourceConnection.providerType,
            project.sourceConnection.providerOptions,
        );
        const assets = await assetProvider.getAssets();

        dispatch({ type: ActionTypes.LOAD_PROJECT_ASSETS_SUCCESS, assets });

        return assets;
    };
}

export function saveAsset(asset: IAsset) {
    return (dispatch) => {
        dispatch({ type: ActionTypes.SAVE_ASSET_SUCCESS, asset });
        return asset;
    };
}
