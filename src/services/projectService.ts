import _ from "lodash";
import shortid from "shortid";
import { StorageProviderFactory } from "../providers/storage/storageProviderFactory";
import {
    IProject, ISecurityToken, AppError,
    ErrorCode, ModelPathType, IActiveLearningSettings, IProviderOptions,
} from "../models/applicationState";
import Guard from "../common/guard";
import { constants } from "../common/constants";
import { ExportProviderFactory } from "../providers/export/exportProviderFactory";
import { decryptProject, encryptProject } from "../common/utils";
import packageJson from "../../package.json";
import { ExportAssetState } from "../providers/export/exportProvider";
import { IExportFormat } from "vott-react";
import { AssetProviders } from "../providers/storage/assetProviders";

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

const defaultActiveLearningSettings: IActiveLearningSettings = {
    autoDetect: false,
    predictTag: true,
    modelPathType: ModelPathType.Coco,
};

const defaultExportOptions: IExportFormat = {
    providerType: "vottJson",
    providerOptions: {
        assetState: ExportAssetState.Visited,
        includeImages: true,
    },
};

/**
 * @name - Project Service
 * @description - Functions for dealing with projects
 */
export default class ProjectService implements IProjectService {
    public static getProjectSourceFolderPath(project: IProject): string {
        const { providerType, providerOptions } = project.sourceConnection;
        if (providerType === AssetProviders.LocalFileSystemProxy) {
            return `file:${(providerOptions as IProviderOptions).folderPath}/`;
        }
    }
    /**
     * Loads a project
     * @param project The project JSON to load
     * @param securityToken The security token used to decrypt sensitive project settings
     */
    public load(project: IProject, securityToken: ISecurityToken): Promise<IProject> {
        Guard.null(project);

        try {
            const loadedProject = decryptProject(project, securityToken);

            // Ensure tags is always initialized to an array
            if (!loadedProject.tags) {
                loadedProject.tags = [];
            }

            // Initialize active learning settings if they don't exist
            if (!loadedProject.activeLearningSettings) {
                loadedProject.activeLearningSettings = defaultActiveLearningSettings;
            }

            // Initialize export settings if they don't exist
            if (!loadedProject.exportFormat) {
                loadedProject.exportFormat = defaultExportOptions;
            }

            this.ensureBackwardsCompatibility(loadedProject);

            return Promise.resolve({ ...loadedProject });
        } catch (e) {
            const error = new AppError(ErrorCode.ProjectInvalidSecurityToken, "Error decrypting project settings");
            return Promise.reject(error);
        }
    }

    /**
     * Save a project
     * @param project - Project to save
     * @param securityToken - Security Token to encrypt
     */
    public async save(project: IProject, securityToken: ISecurityToken): Promise<IProject> {
        Guard.null(project);

        if (!project.id) {
            project.id = shortid.generate();
        }

        // Ensure tags is always initialized to an array
        if (!project.tags) {
            project.tags = [];
        }

        // Initialize active learning settings if they don't exist
        if (!project.activeLearningSettings) {
            project.activeLearningSettings = defaultActiveLearningSettings;
        }

        // Initialize export settings if they don't exist
        if (!project.exportFormat) {
            project.exportFormat = defaultExportOptions;
        }

        project.version = packageJson.version;

        const storageProvider = StorageProviderFactory.createFromConnection(project.targetConnection);
        await this.saveExportSettings(project);
        project = encryptProject(project, securityToken);

        await storageProvider.writeText(
            `${project.name}${constants.projectFileExtension}`,
            JSON.stringify(project, null, 4),
        );

        return project;
    }

    /**
     * Delete a project
     * @param project - Project to delete
     */
    public async delete(project: IProject): Promise<void> {
        Guard.null(project);

        const storageProvider = StorageProviderFactory.createFromConnection(project.targetConnection);

        // Delete all asset metadata files created for project
        const deleteFiles = _.values(project.assets)
            .map((asset) => storageProvider.deleteFile(`${asset.id}${constants.assetMetadataFileExtension}`));

        await Promise.all(deleteFiles);
        await storageProvider.deleteFile(`${project.name}${constants.projectFileExtension}`);
    }

    /**
     * Checks whether or not the project would cause a duplicate at the target connection
     * @param project The project to validate
     * @param projectList The list of known projects
     */
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

    /**
     * Ensures backwards compatibility with project
     * @param project The project to update
     */
    private ensureBackwardsCompatibility(project: IProject) {
        const projectVersion = project.version.toLowerCase();

        if (projectVersion.startsWith("2.0.0")) {
            // Required for backwards compatibility with v2.0.0 release
            if (project.exportFormat.providerType === "tensorFlowPascalVOC") {
                project.exportFormat.providerType = "pascalVOC";
            }
        }
    }
}
