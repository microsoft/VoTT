import { Dispatch, Action } from "redux";
import ProjectService from "../../services/projectService";
import { IProject, IAsset, IAssetMetadata } from "../../models/applicationState";
import { ActionTypes } from "./actionTypes";
import { AssetService } from "../../services/assetService";
import { ExportProviderFactory } from "../../providers/export/exportProviderFactory";
import { createPayloadAction, IPayloadAction, createAction } from "./actionCreators";
import store from "../store/store";

export default interface IProjectActions {
    loadProject(project: IProject): Promise<IProject>;
    saveProject(project: IProject): Promise<IProject>;
    deleteProject(project: IProject): Promise<void>;
    closeProject();
    exportProject(project: IProject): Promise<void>;
    loadAssets(project: IProject): Promise<IAsset[]>;
    loadAssetMetadata(project: IProject, asset: IAsset): Promise<IAssetMetadata>;
    saveAssetMetadata(project: IProject, assetMetadata: IAssetMetadata): Promise<IAssetMetadata>;
}

export function loadProject(project: IProject): (dispatch: Dispatch) => Promise<IProject> {
    return (dispatch: Dispatch) => {
        dispatch(loadProjectAction(project));
        return Promise.resolve(project);
    };
}

export function saveProject(project: IProject): (dispatch: Dispatch, getState: any) => Promise<IProject> {
    return async (dispatch: Dispatch, getState: any) => {
        const projectService = new ProjectService();
        const projectName = project["name"];
        const sourceConnection = project.sourceConnection.name;
        const targetConnection = project.targetConnection.name;
        const projectList = getState().recentProjects;
        if (projectList && projectList.length > 0) {
            const isNew = (projectList.find((project) => project.name === projectName) === undefined) &&
                        (projectList.find(
                            (project) => project.sourceConnection.name === sourceConnection) === undefined) &&
                        (projectList.find(
                            (project) => project.targetConnection.name === targetConnection) === undefined);
            if (isNew) {
                project = await projectService.save(project);
                dispatch(saveProjectAction(project));
            } else {
                throw new Error("Cannot create duplicate projects");
            }
        } else {
            project = await projectService.save(project);
            dispatch(saveProjectAction(project));
        }
        // project = await projectService.save(project);
        return project;
    };
}

export function deleteProject(project: IProject): (dispatch: Dispatch) => Promise<void> {
    return async (dispatch: Dispatch) => {
        const projectService = new ProjectService();
        await projectService.delete(project);
        dispatch(deleteProjectAction(project));
    };
}

export function closeProject(): (dispatch: Dispatch) => void {
    return (dispatch: Dispatch) => {
        dispatch({ type: ActionTypes.CLOSE_PROJECT_SUCCESS });
    };
}

export function loadAssets(project: IProject): (dispatch: Dispatch) => Promise<IAsset[]> {
    return async (dispatch: Dispatch) => {
        const assetService = new AssetService(project);
        const assets = await assetService.getAssets();
        dispatch(loadProjectAssetsAction(assets));

        return assets;
    };
}

export function loadAssetMetadata(project: IProject, asset: IAsset): (dispatch: Dispatch) => Promise<IAssetMetadata> {
    return async (dispatch: Dispatch) => {
        const assetService = new AssetService(project);
        const assetMetadata = await assetService.getAssetMetadata(asset);
        dispatch(loadAssetMetadataAction(assetMetadata));

        return { ...assetMetadata };
    };
}

export function saveAssetMetadata(
    project: IProject,
    assetMetadata: IAssetMetadata): (dispatch: Dispatch) => Promise<IAssetMetadata> {
    return async (dispatch: Dispatch) => {
        const assetService = new AssetService(project);
        const savedMetadata = await assetService.save(assetMetadata);
        dispatch(saveAssetMetadataAction(savedMetadata));

        return { ...savedMetadata };
    };
}

export function exportProject(project: IProject): (dispatch: Dispatch) => Promise<void> {
    return async (dispatch: Dispatch) => {
        if (project.exportFormat && project.exportFormat.providerType) {
            const exportProvider = ExportProviderFactory.create(
                project.exportFormat.providerType,
                project,
                project.exportFormat.providerOptions);

            await exportProvider.export();

            dispatch(exportProjectAction(project));
        }
    };
}

export interface ILoadProjectAction extends IPayloadAction<string, IProject> {
    type: ActionTypes.LOAD_PROJECT_SUCCESS;
}

export interface ICloseProjectAction extends Action<string> {
    type: ActionTypes.CLOSE_PROJECT_SUCCESS;
}

export interface ISaveProjectAction extends IPayloadAction<string, IProject> {
    type: ActionTypes.SAVE_PROJECT_SUCCESS;
}

export interface IDeleteProjectAction extends IPayloadAction<string, IProject> {
    type: ActionTypes.DELETE_PROJECT_SUCCESS;
}

export interface ILoadProjectAssetsAction extends IPayloadAction<string, IAsset[]> {
    type: ActionTypes.LOAD_PROJECT_ASSETS_SUCCESS;
}

export interface ILoadAssetMetadataAction extends IPayloadAction<string, IAssetMetadata> {
    type: ActionTypes.LOAD_ASSET_METADATA_SUCCESS;
}

export interface ISaveAssetMetadataAction extends IPayloadAction<string, IAssetMetadata> {
    type: ActionTypes.SAVE_ASSET_METADATA_SUCCESS;
}

export interface IExportProjectAction extends IPayloadAction<string, IProject> {
    type: ActionTypes.EXPORT_PROJECT_SUCCESS;
}

export const loadProjectAction = createPayloadAction<ILoadProjectAction>(ActionTypes.LOAD_PROJECT_SUCCESS);
export const closeProjectAction = createAction<ICloseProjectAction>(ActionTypes.CLOSE_PROJECT_SUCCESS);
export const saveProjectAction = createPayloadAction<ISaveProjectAction>(ActionTypes.SAVE_PROJECT_SUCCESS);
export const deleteProjectAction = createPayloadAction<IDeleteProjectAction>(ActionTypes.DELETE_PROJECT_SUCCESS);
export const loadProjectAssetsAction =
    createPayloadAction<ILoadProjectAssetsAction>(ActionTypes.LOAD_PROJECT_ASSETS_SUCCESS);
export const loadAssetMetadataAction =
    createPayloadAction<ILoadAssetMetadataAction>(ActionTypes.LOAD_ASSET_METADATA_SUCCESS);
export const saveAssetMetadataAction =
    createPayloadAction<ISaveAssetMetadataAction>(ActionTypes.SAVE_ASSET_METADATA_SUCCESS);
export const exportProjectAction =
    createPayloadAction<IExportProjectAction>(ActionTypes.EXPORT_PROJECT_SUCCESS);
