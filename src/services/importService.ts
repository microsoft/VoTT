import shortid from "shortid";
import {
    IProject, ITag, IConnection, AppError, ErrorCode,
    IAssetMetadata, IRegion, RegionType, AssetState, IFileInfo,
    IAsset, AssetType,
} from "../models/applicationState";
import { IV1Project, IV1Region } from "../models/v1Models";
import packageJson from "../../package.json";
import { AssetService } from "./assetService";
import HtmlFileReader from "../common/htmlFileReader";
import { encodeFileURI, normalizeSlashes } from "../common/utils";
import Guard from "../common/guard";

/**
 * Functions required for an import service
 * @member convertProject - Converts a v1 project to v2 project
 */
interface IImportService {
    convertProject(project: IFileInfo): Promise<IProject>;
    generateAssets(v1Project: IFileInfo, v2Project: IProject): Promise<IAssetMetadata[]>;
}

interface IV1Frame {
    name: string | number;
    regions: IV1Region[];
}

/**
 * @name - Import Service
 * @description - Functions for importing v1 projects to v2 application
 */
export default class ImportService implements IImportService {
    private assetService: AssetService;

    /**
     * Converts given v1 project information to v2 format
     * @param projectInfo The project file information and content
     */
    public async convertProject(projectInfo: IFileInfo): Promise<IProject> {
        Guard.null(projectInfo);

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
        Guard.null(v1Project);
        Guard.null(v2Project);

        let originalProject: IV1Project;
        let generatedAssetMetadata: IAssetMetadata[] = [];
        this.assetService = new AssetService(v2Project);

        originalProject = JSON.parse(v1Project.content as string);

        const frames: IV1Frame[] = Object.keys(originalProject.frames).map((frameName) => {
            return {
                name: frameName,
                regions: originalProject.framerate[frameName],
            };
        });

        if (this.isVideoProject(v1Project)) {
            generatedAssetMetadata = await this.generateVideoAssets(v1Project, frames);
            v2Project.lastVisitedAssetId = generatedAssetMetadata[generatedAssetMetadata.length - 1].asset.id;
        } else {
            generatedAssetMetadata = await this.generateImageAssets(v1Project, frames);
        }
        return generatedAssetMetadata;
    }

    /**
     * Generate assets for V1 Image Project frames and regions
     * @param v1Project - v1 Project content and file information
     * @param frameList - Dictionary of frames:regions in v1 project
     * @param assetService - assetService corresponding to v2 project
     */
    private async generateImageAssets(v1Project: IFileInfo, frames: IV1Frame[]): Promise<IAssetMetadata[]> {
        const originalProject = JSON.parse(v1Project.content as string);
        const projectPath = normalizeSlashes(v1Project.file.path.replace(/\.[^/.]+$/, ""));

        return frames.mapAsync(async (frame) => {
            const filePath = `${projectPath}/${frame.name}`;
            const asset = AssetService.createAssetFromFilePath(filePath);
            asset.path = encodeFileURI(asset.path, true);
            const assetState = this.getAssetState(originalProject, frame);

            return await this.getPopulatedAssetMetadata(asset, assetState, frame.regions);
        });
    }

    /**
     * Generate assets for V1 Video Project frames and regions
     * @param v1Project - v1 Project content and file information
     * @param frameList - Dictionary of frames:regions in v1 project
     * @param assetService - assetService corresponding to v2 project
     */
    private async generateVideoAssets(v1Project: IFileInfo, frames: IV1Frame[]): Promise<IAssetMetadata[]> {
        const parent = await this.createParentVideoAsset(v1Project);
        const originalProject = JSON.parse(v1Project.content as string);
        const projectPath = normalizeSlashes(v1Project.file.path.replace(/\.[^/.]+$/, ""));

        return frames.mapAsync(async (frame) => {
            const frameInt = Number(frame.name);
            const timestamp = (frameInt - 1) / Number(originalProject.framerate);
            const asset = this.getVideoFrameAsset(parent, projectPath, timestamp);
            const assetState = this.getAssetState(originalProject, frame);

            return await this.getPopulatedAssetMetadata(asset, assetState, frame.regions, parent);
        });
    }

    private isVideoProject(v1Project: IFileInfo): boolean {
        const pathParts = v1Project.file.path.split(/[\\\/]/);
        const fileName = pathParts[pathParts.length - 1];
        const fileNameParts = fileName.split(".");

        return fileNameParts[1] && AssetService.getAssetType(fileNameParts[1]) === AssetType.Video;
    }

    /**
     * Generate parent asset based on V1 Project video assets
     * @param project - V1 Project Content and File Information
     */
    private async createParentVideoAsset(v1Project: IFileInfo): Promise<IAsset> {
        const filePath = v1Project.file.path.replace(/\.[^/.]+$/, "");
        const parentAsset = AssetService.createAssetFromFilePath(filePath, filePath.replace(/^.*[\\\/]/, ""));
        const assetProps = await HtmlFileReader.readAssetAttributes(parentAsset);

        parentAsset.size = { height: assetProps.height, width: assetProps.width };
        parentAsset.state = AssetState.Visited;
        parentAsset.path = encodeFileURI(filePath, true);

        return parentAsset;
    }

    /**
     * Generate connections from v1 project file location
     * @param project - V1 Project Content and File Information
     */
    private generateConnection(project: IFileInfo): IConnection {
        const folderPath = this.isVideoProject(project)
            ? project.file.path.replace(/[^(\/|\\)]*$/, "")
            : project.file.path.replace(".json", "");

        const connection: IConnection = {
            id: shortid.generate(),
            name: `${project.file.name.split(".")[0]} Connection`,
            providerType: "localFileSystemProxy",
            providerOptions: {
                folderPath: normalizeSlashes(folderPath),
            },
        };

        return connection;
    }

    /**
     * Parse v1 project's tag string and return array of ITags
     * @param project - V1 Project Content and File Information
     */
    private parseTags(project: IV1Project): ITag[] {
        const tagStrings = project.inputTags.split(",");
        const tagColors = project.tag_colors;

        return project.tag_colors.map((v1Tag, index) => {
            return {
                name: tagStrings[index],
                color: tagColors[index],
            } as ITag;
        });
    }

    /**
     * Generate regions based on V1 Project asset metadata
     * @param metadata - Asset Metadata from asset created from file path
     * @param frameRegions - V1 Regions within the V1 Frame
     */
    private addRegions(metadata: IAssetMetadata, frameRegions: IV1Region[]): IAssetMetadata {
        for (const region of frameRegions) {
            const generatedRegion: IRegion = {
                id: region.UID,
                type: RegionType.Rectangle,
                tags: region.tags,
                points: [{ x: region.x1, y: region.y1 },
                { x: region.x1, y: region.y2 },
                { x: region.x2, y: region.y1 },
                { x: region.x2, y: region.y2 }],
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

    private getVideoFrameAsset(parent: IAsset, filePath: string, timestamp: number): IAsset {
        return {
            ...AssetService.createAssetFromFilePath(encodeFileURI(`${filePath}#t=${timestamp}`)),
            timestamp,
            parent,
            type: AssetType.VideoFrame,
            size: parent.size,
        };
    }

    private getAssetState(originalProject: any, frame: IV1Frame): AssetState {
        return originalProject.visitedFrames.indexOf(frame.name) > -1 && frame.regions.length > 0
            ? AssetState.Tagged
            : (originalProject.visitedFrames.indexOf(frame.name) > -1
                ? AssetState.Visited
                : AssetState.NotVisited
            );
    }

    private async getPopulatedAssetMetadata(
        asset: IAsset,
        assetState: AssetState,
        frameRegions: IV1Region[],
        parent?: IAsset,
    ): Promise<IAssetMetadata> {
        const metadata = await this.assetService.getAssetMetadata(asset);
        const taggedMetadata = this.addRegions(metadata, frameRegions);
        taggedMetadata.asset.state = assetState;

        if (parent) {
            taggedMetadata.asset.parent = parent;
        }

        if (!metadata.asset.size) {
            metadata.asset.size = await HtmlFileReader.readAssetAttributes(asset);
        }

        return taggedMetadata;
    }
}
