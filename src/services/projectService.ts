import _ from "lodash";
import shortid from "shortid";
import { StorageProviderFactory } from "../providers/storage/storageProviderFactory";
import { IProject, ISecurityToken, AppError, ErrorCode, AssetState, IAssetMetadata } from "../models/applicationState";
import Guard from "../common/guard";
import { constants } from "../common/constants";
import { ExportProviderFactory } from "../providers/export/exportProviderFactory";
import { decryptProject, encryptProject } from "../common/utils";
import packageJson from "../../package.json";
import { AssetService } from "./assetService";

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
    deleteTag(project: IProject, tag: string, currentAsset: IAssetMetadata): Promise<IAssetMetadata>;
    updateTag(project: IProject, tag: string, newTag: string, currentAsset: IAssetMetadata): Promise<IAssetMetadata>;
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
     * @param securityToken - Security Token to encrypt
     */
    public async save(project: IProject, securityToken: ISecurityToken): Promise<IProject> {
        Guard.null(project);

        if (!project.id) {
            project.id = shortid.generate();
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

    public async deleteTag(project: IProject,
                           tag: string, currentAsset: IAssetMetadata): Promise<IAssetMetadata> {
        return await this.updateProjectTags(
            project, tag, currentAsset, (tags) => tags.filter((t) => t !== tag));
    }

    public async updateTag(project: IProject, tag: string,
                           newTag: string, currentAsset: IAssetMetadata): Promise<IAssetMetadata> {
        return await this.updateProjectTags(
            project, tag, currentAsset, (tags) => tags.map((t) => (t === tag) ? newTag : t));
    }

    private async updateProjectTags(
            project: IProject, tag: string, currentAsset: IAssetMetadata, transformer: (tags: string[]) => string[]) {
        const assetService = new AssetService(project);
        const assetKeys = Object.keys(project.assets);
        for (const assetKey of assetKeys) {
            const asset = project.assets[assetKey];
            const assetMetadata = await assetService.getAssetMetadata(asset);
            const updatedAssetMetadata = this.updateAssetMetadata(assetMetadata, tag, transformer);
            if (updatedAssetMetadata) {
                assetService.save(updatedAssetMetadata);
            }
        }
        return this.updateAssetMetadata(currentAsset, tag, transformer);
    }

    private updateAssetMetadata(asset: IAssetMetadata, tag: string, transformer: (tags: string[]) => string[]) {
        let foundTag = false;
        for (const region of asset.regions) {
            if (region.tags.find((t) => t === tag)) {
                foundTag = true;
                region.tags = transformer(region.tags);
            }
        }
        if (foundTag) {
            asset.regions = asset.regions.filter((region) => region.tags.length > 0);
            return asset;
        }
        return null;
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
