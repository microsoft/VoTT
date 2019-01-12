import shortid from "shortid";
import { StorageProviderFactory } from "../providers/storage/storageProviderFactory";
import { IProject } from "../models/applicationState";
import Guard from "../common/guard";
import { constants } from "../common/constants";
import { ExportProviderFactory } from "../providers/export/exportProviderFactory";

export interface IProjectService {
    save(project: IProject): Promise<IProject>;
    delete(project: IProject): Promise<void>;
    isDuplicate(project: IProject, projectList: IProject[]): boolean;
}

export default class ProjectService implements IProjectService {
    public save(project: IProject) {
        Guard.null(project);

        return new Promise<IProject>(async (resolve, reject) => {
            try {
                if (!project.id) {
                    project.id = shortid.generate();
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

    public delete(project: IProject) {
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
        const projectId = project.id;
        const projectName = project.name;
        const sourceConnection = project.sourceConnection.name;
        const targetConnection = project.targetConnection.name;
        if (projectList && projectList.length > 0) {
            const duplicate = (projectId === undefined) &&
                             (projectList.find((p) =>
                                p.name === projectName) !== undefined) &&
                             (projectList.find((p) =>
                                p.sourceConnection.name === sourceConnection) !== undefined) &&
                             (projectList.find((p) =>
                                p.targetConnection.name === targetConnection) !== undefined);
            if (duplicate) {
                return true;
            } else {
                return false;
            }
        } else {
            return true;
        }
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
}
