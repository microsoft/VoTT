// import shortid from "shortid";
// import { StorageProviderFactory } from "../providers/storage/storageProviderFactory";
import { IProject, ISecurityToken, AppError, ErrorCode } from "../models/applicationState";
// import Guard from "../common/guard";
// import { constants } from "../common/constants";
// import { ExportProviderFactory } from "../providers/export/exportProviderFactory";
// import { decryptProject, encryptProject } from "../common/utils";

/**
 * Functions required for a project service
 * @member save - Save a project
 * @member delete - Delete a project
 */
export interface IImportService {
    generateAssets(project: IProject, securityToken: ISecurityToken): Promise<IProject>;
    generateConnections(project: IProject, securityToken: ISecurityToken): Promise<IProject>;
}

/**
 * @name - Project Service
 * @description - Functions for dealing with projects
 */
export default class ImportService implements IImportService {
    private generateAssets(project: IProject, securityToken: ISecurityToken): Promise<IProject> {

    }

    private generateConnections(project: IProject, securityToken: ISecurityToken): Promise<IProject> {

    }
}
