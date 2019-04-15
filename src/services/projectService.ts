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
import { forEachAsync } from "../common/extensions/array";

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
    deleteTag(project: IProject, tagName: string, currentAsset: IAssetMetadata): Promise<IAssetMetadata>;
    renameTag(project: IProject, tagName: string, newTagName: string, currentAsset: IAssetMetadata): Promise<IAssetMetadata>;
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

    /**
     * Delete a tag from a project, including from all asset metadata files
     * @param project The project containing tag to delete
     * @param tagName Name of tag to delete
     * @param currentAsset Current asset being viewed. Makes changes and returns updated asset to avoid
     * needing to reload the asset in the editor page
     */
    public async deleteTag(project: IProject, tagName: string, currentAsset: IAssetMetadata): Promise<IAssetMetadata> {
        const transformer = (tags) => tags.filter((t) => t!== tagName);
        return await this.updateProjectTags(project, tagName, currentAsset, transformer);
    }

    /**
     * Rename a tag within a project, including within all asset metadata files
     * @param project The project containing tag to rename
     * @param tagName Name of tag to rename
     * @param currentAsset Current asset being viewed. Makes changes and returns updated asset to avoid
     * needing to reload the asset in the editor page
     */
    public async renameTag(project: IProject, tagName: string, newTagName: string, currentAsset: IAssetMetadata): Promise<IAssetMetadata> {
        const transformer = (tags) => tags.map((t) => (t === tagName) ? newTagName : t);
        return await this.updateProjectTags(project, tagName, currentAsset, transformer);
    }

    /**
     * Update tags within project, including within all asset metadata files
     * @param project The project containing tags to update
     * @param tagName Name of tag to update within project
     * @param currentAsset Current asset being viewed. Makes changes and returns updated asset to avoid
     * needing to reload the asset in the editor page
     * @param transformer Function that accepts array of tags from a region and returns a modified array of tags
     */
    private async updateProjectTags(project: IProject, tagName: string, currentAsset: IAssetMetadata, transformer: (tags: string[]) => string[]) {
        const assetService = new AssetService(project);
        const assetKeys = Object.keys(project.assets);
        await assetKeys.forEachAsync(async (assetKey) => {
            const asset = project.assets[assetKey];
            if (asset.state !== AssetState.Tagged) {
                return;
            }
            const assetMetadata = await assetService.getAssetMetadata(asset);
            const updatedAssetMetadata = this.updateTagInAssetMetadata(assetMetadata, tagName, transformer);
            if (updatedAssetMetadata) {
                await assetService.save(updatedAssetMetadata);
            }
        });
        return this.updateTagInAssetMetadata(currentAsset, tagName, transformer);
    }

    /**
     * Update tag within asset metadata object
     * @param assetMetadata Asset metadata to update
     * @param tagName Name of tag being updated
     * @param transformer Function that accepts array of tags from a region and returns a modified array of tags
     * @returns Modified asset metadata object or null if object does not need to be modified
     */
    private updateTagInAssetMetadata(assetMetadata: IAssetMetadata, tagName: string, transformer: (tags: string[]) => string[]) {
        let foundTag = false;
        for (const region of assetMetadata.regions) {
            if (region.tags.find((t) => t === tagName)) {
                foundTag = true;
                region.tags = transformer(region.tags);
            }
        }
        if (foundTag) {
            assetMetadata.regions = assetMetadata.regions.filter((region) => region.tags.length > 0);
            assetMetadata.asset.state = (assetMetadata.regions.length) ? AssetState.Tagged : AssetState.Visited;
            return assetMetadata;
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
