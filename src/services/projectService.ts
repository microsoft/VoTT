import shortid from "shortid";
import { StorageProviderFactory } from "../providers/storage/storageProviderFactory";
import { IProject, ISecureString, IProviderOptions, ISecurityToken } from "../models/applicationState";
import Guard from "../common/guard";
import { constants } from "../common/constants";
import { ExportProviderFactory } from "../providers/export/exportProviderFactory";
import { encryptObject, decryptObject } from "../common/crypto";

/**
 * Functions required for a project service
 * @member save - Save a project
 * @member delete - Delete a project
 */
export interface IProjectService {
    load(project: IProject, securityToken: ISecurityToken): Promise<IProject>;
    save(project: IProject, securityToken?: ISecurityToken): Promise<IProject>;
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

        if (securityToken) {
            project = this.decryptProject(project, securityToken);
        }

        return Promise.resolve(project);
    }

    /**
     * Save a project
     * @param project - Project to save
     */
    public save(project: IProject, securityToken: ISecurityToken = null): Promise<IProject> {
        Guard.null(project);

        return new Promise<IProject>(async (resolve, reject) => {
            try {
                if (!project.id) {
                    project.id = shortid.generate();
                }

                if (securityToken) {
                    project = this.encryptProject(project, securityToken);
                }

                const storageProvider = StorageProviderFactory.create(
                    project.targetConnection.providerType,
                    project.targetConnection.providerOptions,
                );

                await this.saveExportSettings(project);
                await this.saveProjectFile(project);

                await storageProvider.writeText(
                    `${project.name}${constants.projectFileExtension}`,
                    JSON.stringify(project, null, 4));

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

    private async saveProjectFile(project: IProject): Promise<void> {
        const storageProvider = StorageProviderFactory.create(
            project.targetConnection.providerType,
            project.targetConnection.providerOptions,
        );

        await storageProvider.writeText(
            `${project.name}${constants.projectFileExtension}`,
            JSON.stringify(project, null, 4));
    }

    private encryptProject(project: IProject, securityToken: ISecurityToken): IProject {
        const encrypted: IProject = {
            ...project,
            sourceConnection: { ...project.sourceConnection },
            targetConnection: { ...project.targetConnection },
            exportFormat: { ...project.exportFormat },
        };

        encrypted.sourceConnection.providerOptions =
            this.encryptProviderOptions(project.sourceConnection.providerOptions, securityToken.key);
        encrypted.targetConnection.providerOptions =
            this.encryptProviderOptions(project.targetConnection.providerOptions, securityToken.key);

        if (encrypted.exportFormat) {
            encrypted.exportFormat.providerOptions =
                this.encryptProviderOptions(project.exportFormat.providerOptions, securityToken.key);
        }

        return encrypted;
    }

    private decryptProject(project: IProject, securityToken: ISecurityToken): IProject {
        const decrypted: IProject = {
            ...project,
            sourceConnection: { ...project.sourceConnection },
            targetConnection: { ...project.targetConnection },
            exportFormat: { ...project.exportFormat },
        };

        decrypted.sourceConnection.providerOptions =
            this.decryptProviderOptions(decrypted.sourceConnection.providerOptions, securityToken.key);
        decrypted.targetConnection.providerOptions =
            this.decryptProviderOptions(decrypted.targetConnection.providerOptions, securityToken.key);

        if (decrypted.exportFormat) {
            decrypted.exportFormat.providerOptions =
                this.decryptProviderOptions(decrypted.exportFormat.providerOptions, securityToken.key);
        }

        return decrypted;
    }

    private encryptProviderOptions(providerOptions: IProviderOptions, secret: string): ISecureString {
        if (!providerOptions) {
            return null;
        }

        return {
            encrypted: encryptObject(providerOptions, secret),
        };
    }

    private decryptProviderOptions<T = IProviderOptions>(providerOptions: IProviderOptions, secret): T {
        const secureString = providerOptions as ISecureString;
        if (!(secureString && secureString.encrypted)) {
            return null;
        }

        return decryptObject(providerOptions.encrypted, secret) as T;
    }
}
