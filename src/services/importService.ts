import shortid from "shortid";
import MD5 from "md5.js";
import { IProject, ITag, IConnection, AppError, ErrorCode, IPoint,
        IAssetMetadata, IRegion, RegionType, AssetState, IFileInfo,
        IAsset, AssetType } from "../models/applicationState";
import { IV1Project, IV1Region } from "../models/v1Models";
import packageJson from "../../package.json";
import { AssetService } from "./assetService";
import IProjectActions from "../redux/actions/projectActions";
import HtmlFileReader from "../common/htmlFileReader";

/**
 * Functions required for an import service
 * @member convertProject - Converts a v1 project to v2 project
 */
interface IImportService {
    convertProject(project: IFileInfo): Promise<IProject>;
    generateAssets(v1Project: IFileInfo, v2Project: IProject, parent?: IAsset): Promise<IAssetMetadata[]>;
}

/**
 * @name - Import Service
 * @description - Functions for importing v1 projects to v2 application
 */
export default class ImportService implements IImportService {
    private actions: IProjectActions;
    constructor(actions: IProjectActions) {
        this.actions = actions;
    }

    /**
     * Converts given v1 project information to v2 format
     * @param projectInfo The project file information and content
     */
    public async convertProject(projectInfo: IFileInfo): Promise<IProject> {
        let originalProject: IV1Project;
        let convertedProject: IProject;
        let connection: IConnection;
        let parsedTags: ITag[];

        try {
            originalProject = JSON.parse(projectInfo.content as string);
        } catch (e) {
            throw new AppError(ErrorCode.ProjectInvalidJson, "Error parsing JSON");
        }

        parsedTags = this.parseTags(originalProject);

        connection = this.generateConnection(projectInfo);

        // map v1 values to v2 values
        convertedProject = {
            id: shortid.generate(),
            name: projectInfo.file.name.split(".")[0],
            version: packageJson.version,
            securityToken: `${projectInfo.file.name.split(".")[0]} Token`,
            description: "Converted V1 Project",
            tags: parsedTags,
            sourceConnection: connection,
            targetConnection: connection,
            exportFormat: null,
            videoSettings: {
                frameExtractionRate: originalProject.framerate ? Number(originalProject.framerate) : 15,
            },
            autoSave: true,
        };

        return convertedProject;
    }

    /**
     * Generate assets based on V1 Project frames and regions
     * @param project - V1 Project Content and File Information
     */
    public async generateAssets(v1Project: IFileInfo, v2Project: IProject): Promise<IAssetMetadata[]> {
        let originalProject: IV1Project;
        let generatedAssetMetadata: IAssetMetadata[] = [];
        const assetService = new AssetService(v2Project);

        originalProject = JSON.parse(v1Project.content as string);

        const pathParts = v1Project.file.path.split(/[\\\/]/);
        const fileName = pathParts[pathParts.length - 1];
        const fileNameParts = fileName.split(".");

        if (fileNameParts[1] && AssetService.getAssetType(fileNameParts[1]) === AssetType.Video) {
            generatedAssetMetadata = await this.generateVideoAssets(v1Project, originalProject.frames, assetService);
            v2Project.lastVisitedAssetId = generatedAssetMetadata[generatedAssetMetadata.length - 1].asset.id;
        } else {
            generatedAssetMetadata = await this.generateImageAssets(v1Project, originalProject.frames, assetService);
        }
        return generatedAssetMetadata;
    }

    /**
     * Generate parent asset based on V1 Project video assets
     * @param project - V1 Project Content and File Information
     */
    private async createParentVideoAsset(v1Project: IFileInfo): Promise<IAsset> {
        let parentAsset: IAsset;

        parentAsset = {
            format: "mp4",
            id: new MD5().update(v1Project.file.path.replace(/\.[^/.]+$/, "")).digest("hex"),
            name: v1Project.file.path.replace(/\.[^/.]+$/, "").replace(/^.*[\\\/]/, ""),
            path: `file:${v1Project.file.path.replace(/\.[^/.]+$/, "")}`,
            size: {
                height: 0,
                width: 0,
            },
            state: 1,
            type: AssetType.Video,
        };
        const assetProps = await HtmlFileReader.readAssetAttributes(parentAsset);
        parentAsset.size = { height: assetProps.height, width: assetProps.width };
        return parentAsset;
    }

    /**
     * Generate connections from v1 project file location
     * @param project - V1 Project Content and File Information
     */
    private generateConnection(project: IFileInfo): IConnection {
        const connection: IConnection = {
            id: shortid.generate(),
            name: `${project.file.name.split(".")[0]} Connection`,
            providerType: "localFileSystemProxy",
            providerOptions: {
                folderPath: project.file.path.replace(/[^\/]*$/, ""),
            },
        };

        return connection;
    }

    /**
     * Parse v1 project's tag string and return array of ITags
     * @param project - V1 Project Content and File Information
     */
    private parseTags(project: any): ITag[] {
        const finalTags: ITag[] = [];
        const tagStrings = project.inputTags.split(",");
        const tagColors = project.tag_colors;

        for (let i = 0; i < tagColors.length; i++) {
            const newTag = {
                name: tagStrings[i],
                color: tagColors[i],
            };
            finalTags.push(newTag);
        }
        return finalTags;
    }

    /**
     * Generate regions based on V1 Project asset metadata
     * @param metadata - Asset Metadata from asset created from filepath
     * @param frameRegions - V1 Regions within the V1 Frame
     */
    private addRegions(metadata: IAssetMetadata, frameRegions: IV1Region[]): IAssetMetadata {
        for (const region of frameRegions) {
            const generatedRegion: IRegion = {
                id: region.UID,
                type: RegionType.Rectangle,
                tags: region.tags,
                points: [{x: region.x1, y: region.y1},
                    {x: region.x1, y: region.y2},
                    {x: region.x2, y: region.y1},
                    {x: region.x2, y: region.y2}],
                boundingBox: {
                    height: (region.y2 - region.y1),
                    width: (region.x2 - region.x1),
                    left: region.x1,
                    top: region.y1,
                },
            };
            metadata.regions.push(generatedRegion);
        }
        return metadata;
    }

    /**
     * Generate assets for V1 Image Project frames and regions
     * @param v1Project - v1 Project content and file information
     * @param frameList - Dictionary of frames:regions in v1 project
     * @param assetService - assetService corresponding to v2 project
     */
    private async generateImageAssets(v1Project: IFileInfo, frameList: {[frameName: string]: IV1Region[]},
                                      assetService: AssetService): Promise<IAssetMetadata[]> {
        const generatedAssetMetadata: IAssetMetadata[] = [];
        const originalProject = JSON.parse(v1Project.content as string);

        for (const frameName in frameList) {
            if (frameList.hasOwnProperty(frameName)) {
                const frameRegions = frameList[frameName];
                const asset = AssetService.createAssetFromFilePath(
                    `${v1Project.file.path.replace(/[^\/]*$/, "")}${frameName}`);
                const assetState = originalProject.visitedFrames.indexOf(frameName) > -1 && frameRegions.length > 0
                    ? AssetState.Tagged : (originalProject.visitedFrames.indexOf(frameName) > -1
                    ? AssetState.Visited : AssetState.NotVisited);
                const populatedMetadata = await assetService.getAssetMetadata(asset).then((metadata) => {
                    const taggedMetadata = this.addRegions(metadata, frameRegions);
                    taggedMetadata.asset.state = assetState;
                    taggedMetadata.asset.path = `file:${taggedMetadata.asset.path}`;
                    return taggedMetadata;
                });
                generatedAssetMetadata.push(populatedMetadata);
            }
        }
        return generatedAssetMetadata;
    }

    /**
     * Generate assets for V1 Video Project frames and regions
     * @param v1Project - v1 Project content and file information
     * @param frameList - Dictionary of frames:regions in v1 project
     * @param assetService - assetService corresponding to v2 project
     */
    private async generateVideoAssets(v1Project: IFileInfo, frameList: {[frameName: string]: IV1Region[]},
                                      assetService: AssetService): Promise<IAssetMetadata[]> {
        const generatedAssetMetadata: IAssetMetadata[] = [];
        const parent = await this.createParentVideoAsset(v1Project);
        const originalProject = JSON.parse(v1Project.content as string);

        for (const frameName in frameList) {
            if (frameList.hasOwnProperty(frameName)) {
                const frameRegions = frameList[frameName];
                const frameInt = Number(frameName);
                const timestamp = frameInt / Number(originalProject.framerate) - 1;
                const pathToUse = v1Project.file.path.replace(/\.[^/.]+$/, "");
                const asset = AssetService.createAssetFromFilePath(
                    `${pathToUse}#t=${timestamp}`);
                const assetState = originalProject.visitedFrames.indexOf(frameInt) > -1 && frameRegions.length > 0
                    ? AssetState.Tagged : (originalProject.visitedFrames.indexOf(frameInt) > -1
                    ? AssetState.Visited : AssetState.NotVisited);
                asset.timestamp = timestamp;
                asset.type = AssetType.VideoFrame;
                asset.parent = parent;
                asset.size = asset.parent.size;
                const populatedMetadata = await assetService.getAssetMetadata(asset).then((metadata) => {
                    const taggedMetadata = this.addRegions(metadata, frameRegions);
                    taggedMetadata.asset.state = assetState;
                    taggedMetadata.asset.path = `file:${taggedMetadata.asset.path}`;
                    taggedMetadata.asset.parent = parent;
                    return taggedMetadata;
                });
                generatedAssetMetadata.push(populatedMetadata);
            }
        }
        return generatedAssetMetadata;
    }
}
