import shortid from "shortid";
import { StorageProviderFactory } from "../providers/storage/storageProviderFactory";
import { IProject, ISecurityToken, AppError, ErrorCode } from "../models/applicationState";
import Guard from "../common/guard";
import { constants } from "../common/constants";
import { ExportProviderFactory } from "../providers/export/exportProviderFactory";
import { decryptProject, encryptProject } from "../common/utils";

/**
 * Functions required for a project service
 * @member save - Save a project
 * @member delete - Delete a project
 */
export interface IProjectService {
    load(project: IProject, securityToken: ISecurityToken): Promise<IProject>;
    save(project: IProject, securityToken: ISecurityToken): Promise<IProject>;
    delete(project: IProject): Promise<void>;
    isDuplicate(project: IProject, projectList: IProject[]): boolean;
}

/**
 * @name - Project Service
 * @description - Functions for dealing with projects
 */
export default class ProjectService implements IProjectService {
    /**
     * Loads a project
     * @param project The project JSON to load
     * @param securityToken The security token used to decrypt sensitive project settings
     */
    public load(project: IProject, securityToken: ISecurityToken): Promise<IProject> {
        Guard.null(project);

        try {
            const loadedProject = decryptProject(project, securityToken);
            return Promise.resolve(loadedProject);
        } catch (e) {
            const error = new AppError(ErrorCode.ProjectInvalidSecurityToken, "Error decrypting project settings");
            return Promise.reject(error);
        }
    }

    /**
     * Save a project
     * @param project - Project to save
     */
    public save(project: IProject, securityToken: ISecurityToken): Promise<IProject> {
        Guard.null(project);

        return new Promise<IProject>(async (resolve, reject) => {
            try {
                if (!project.id) {
                    project.id = shortid.generate();
                }

                const storageProvider = StorageProviderFactory.createFromConnection(project.targetConnection);
                await this.saveExportSettings(project);
                project = encryptProject(project, securityToken);

                await storageProvider.writeText(
                    `${project.name}${constants.projectFileExtension}`,
                    JSON.stringify(project, null, 4),
                );

                resolve(project);
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Delete a project
     * @param project - Project to delete
     */
    public delete(project: IProject): Promise<void> {
        Guard.null(project);

        return new Promise<void>(async (resolve, reject) => {
            try {
                const storageProvider = StorageProviderFactory.create(
                    project.targetConnection.providerType,
                    project.targetConnection.providerOptions,
                );

                await storageProvider.deleteFile(`${project.name}${constants.projectFileExtension}`);

                resolve();
            } catch (err) {
                reject(err);
            }
        });
    }

    public isDuplicate(project: IProject, projectList: IProject[]): boolean {
        const duplicateProjects = projectList.find((p) =>
            p.id !== project.id &&
            p.name === project.name &&
            JSON.stringify(p.targetConnection.providerOptions) ===
            JSON.stringify(project.targetConnection.providerOptions),
        );
        return (duplicateProjects !== undefined);
    }

    private async saveExportSettings(project: IProject): Promise<void> {
        if (!project.exportFormat || !project.exportFormat.providerType) {
            return Promise.resolve();
        }

        const exportProvider = ExportProviderFactory.createFromProject(project);

        if (!exportProvider.save) {
            return Promise.resolve();
        }

        project.exportFormat.providerOptions = await exportProvider.save(project.exportFormat);
    }
}
