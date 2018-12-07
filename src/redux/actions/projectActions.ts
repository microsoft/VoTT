import ProjectService from "../../services/projectService";
import { IProject, IAsset, IAssetMetadata } from "../../models/applicationState";
import * as ActionTypes from "./actionTypes";
import { AssetService } from "../../services/assetService";
import { JsonExportProvider } from "../../providers/export/jsonExportProvider";

const projectService = new ProjectService();

export default interface IProjectActions {
    loadProjects(): Promise<IProject[]>;
    loadProject(value: IProject | string): Promise<IProject>;
    saveProject(project: IProject): Promise<IProject>;
    deleteProject(project: IProject): Promise<void>;
    closeProject();
    exportProject(project: IProject): Promise<void>;
    loadAssets(project: IProject): Promise<IAsset[]>;
    loadAssetMetadata(project: IProject, asset: IAsset): Promise<IAssetMetadata>;
    saveAssetMetadata(project: IProject, assetMetadata: IAssetMetadata): Promise<IAssetMetadata>;
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
        const assetService = new AssetService(project);
        const assets = await assetService.getAssets();
        dispatch({ type: ActionTypes.LOAD_PROJECT_ASSETS_SUCCESS, assets });

        return assets;
    };
}

export function loadAssetMetadata(project: IProject, asset: IAsset) {
    return async (dispatch) => {
        const assetService = new AssetService(project);
        const assetMetadata = await assetService.getAssetMetadata(asset);
        dispatch({ type: ActionTypes.LOAD_ASSET_METADATA_SUCCESS, assetMetadata });

        return assetMetadata;
    };
}

export function saveAssetMetadata(project: IProject, assetMetadata: IAssetMetadata) {
    return async (dispatch) => {
        const assetService = new AssetService(project);
        const savedMetadata = await assetService.save(assetMetadata);
        dispatch({ type: ActionTypes.SAVE_ASSET_METADATA_SUCCESS, assetMetadata: savedMetadata });

        return savedMetadata;
    };
}

export function exportProject(project: IProject) {
    return async (dispatch) => {
        const exportProvider = new JsonExportProvider(project, { foo: "bar" });
        await exportProvider.export();

        dispatch({ type: ActionTypes.EXPORT_PROJECT_SUCCESS });
    };
}
