import shortid from "shortid";
import { StorageProviderFactory } from "../providers/storage/storageProviderFactory";
import { IProject } from "../models/applicationState";
import Guard from "../common/guard";
import { constants } from "../common/constants";

export interface IProjectService {
    save(project: IProject): Promise<IProject>;
    delete(project: IProject): Promise<void>;
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
}
