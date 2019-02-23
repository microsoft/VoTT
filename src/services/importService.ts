import shortid from "shortid";
import { IProject, ITag, IConnection, AppError, ErrorCode, IPoint,
        IAssetMetadata, IRegion, RegionType, AssetState, IFileInfo } from "../models/applicationState";
import { IV1Project, IV1Region } from "../models/v1Models";
import packageJson from "../../package.json";
import { AssetService } from "./assetService";
import IProjectActions from "../redux/actions/projectActions";

/**
 * Functions required for an import service
 * @member convertProject - Converts a v1 project to v2 project
 */
export interface IImportService {
    convertProject(project: IFileInfo): Promise<IProject>;
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
                frameExtractionRate: 15,
            },
            autoSave: true,
        };
        return convertedProject;
    }

    public async addAssets(project: IProject, projectInfo: IFileInfo) {
        let generatedAssetMetadata: IAssetMetadata[];
        const assetService = new AssetService(project);
        generatedAssetMetadata = await this.generateAssets(projectInfo, assetService);

        await this.actions.saveProject(project).then((newProj) => {
            this.actions.loadProject(newProj);
        });

        const savedMetadata = generatedAssetMetadata.map((assetMetadata) => {
            return assetService.save(assetMetadata);
        });
        try {
            await Promise.all(savedMetadata);
        } catch (e) {
            throw e;
        }
    }

    /**
     * Generate assets based on V1 Project frames and regions
     * @param project - V1 Project Content and File Information
     */
    public async generateAssets(project: IFileInfo, assetService: AssetService): Promise<IAssetMetadata[]> {
        let originalProject: IV1Project;
        const generatedAssetMetadata: IAssetMetadata[] = [];
        let assetState: AssetState;

        originalProject = JSON.parse(project.content as string);

        for (const frameName in originalProject.frames) {
            if (originalProject.frames.hasOwnProperty(frameName)) {
                const frameRegions = originalProject.frames[frameName];
                const asset = AssetService.createAssetFromFilePath(
                    `${project.file.path.replace(/[^\/]*$/, "")}${frameName}`);
                const populatedMetadata = await assetService.getAssetMetadata(asset).then((metadata) => {
                    assetState = originalProject.visitedFrames.indexOf(frameName) > -1 && frameRegions.length > 0
                        ? AssetState.Tagged : (originalProject.visitedFrames.indexOf(frameName) > -1
                        ? AssetState.Visited : AssetState.NotVisited);
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
     * Generate assets based on V1 Project frames and regions
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
}
