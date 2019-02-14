import shortid from "shortid";
import { IProject, ITag, IConnection, AppError, ErrorCode,
        IAssetMetadata, IRegion, RegionType, AssetState, IFileInfo } from "../models/applicationState";
import { IV1Project } from "../models/v1Models";
import { AssetService } from "./assetService";
import { randomIntInRange } from "../common/utils";
import TagColors from "../react/components/common/tagsInput/tagColors.json";

/**
 * Functions required for an import service
 * @member convertV1 - Converts a v1 project to v2 project
 * @member generateAssets - Generates v2 assets based on v1 project file
 * @member generateConnections - Generates v2 connections based on location of v1 project file
 */
export interface IImportService {
    convertV1(project: IFileInfo): Promise<IProject>;
}

/**
 * @name - Import Service
 * @description - Functions for importing v1 projects to v2 application
 */
export default class ImportService implements IImportService {
    public async convertV1(project: IFileInfo): Promise<IProject> {
        let originalProject: IV1Project;
        let convertedProject: IProject;
        let connections: IConnection[];
        let parsedTags: ITag[];
        let generatedAssetMetadata: any;

        try {
            originalProject = JSON.parse(project.content as string);
        } catch (e) {
            throw new AppError(ErrorCode.ProjectInvalidJson, "Error parsing JSON");
        }

        parsedTags = this.parseTags(originalProject);

        connections = this.generateConnections(project);

        // map v1 values to v2 values
        convertedProject = {
            id: shortid.generate(),
            name: project.file.name.split(".")[0],
            version: "v1-to-v2",
            securityToken: `${project.file.name.split(".")[0]} Token`,
            description: "Converted V1 Project",
            tags: parsedTags,
            sourceConnection: connections[0],
            targetConnection: connections[1],
            exportFormat: null,
            videoSettings: {
                frameExtractionRate: 15,
            },
            autoSave: true,
            assets: {},
        };

        const assetService = new AssetService(convertedProject);
        generatedAssetMetadata = this.generateAssets(project, assetService);

        const saveAssets = generatedAssetMetadata.map((assetMetadata) => {
            // assetMetadata.then((metadata) => {
            //     return assetService.save(metadata);
            // });
            return assetService.save(assetMetadata);
        });

        try {
            Promise.all(saveAssets);
        } catch (e) {
            throw e;
        }

        return convertedProject;
    }

    /**
     * Generate connections from v1 project file location
     * @param project - V1 Project Content and File Information
     */
    private generateConnections(project: any): IConnection[] {
        const sourceConnection: IConnection = {
            id: shortid.generate(),
            name: `${project.file.name.split(".")[0]} Source Connection`,
            providerType: "localFileSystemProxy",
            providerOptions: {
                folderPath: project.file.path.replace(/[^\/]*$/, ""),
            },
        };

        const targetConnection: IConnection = {
            id: shortid.generate(),
            name: `${project.file.name.split(".")[0]} Target Connection`,
            providerType: "localFileSystemProxy",
            providerOptions: {
                folderPath: project.file.path.replace(/[^\/]*$/, ""),
            },
        };

        const connections: IConnection[] = [sourceConnection, targetConnection];

        return(connections);
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
     * @param project - V1 Project Content and File Information
     */
    private generateAssets(project: any, assetService: AssetService): Promise<IAssetMetadata>[] {
        let originalProject: IV1Project;
        const generatedAssetMetadata: Promise<IAssetMetadata>[] = [];
        let generatedRegion: IRegion;
        let assetState: AssetState;
        const currentTagColorIndex = randomIntInRange(0, TagColors.length);

        originalProject = JSON.parse(project.content);

        for (const frameName in originalProject.frames) {
            if (originalProject.frames.hasOwnProperty(frameName)) {
                const frameRegions = originalProject.frames[frameName];
                const asset = AssetService.createAssetFromFilePath(
                    `file:${project.file.path.replace(/[^\/]*$/, "")}${frameName}`);
                let assetMetadata = assetService.getAssetMetadata(asset).then((metadata) => {
                    assetMetadata = metadata;
                    assetState = originalProject.visitedFrames.indexOf(frameName) > -1 && frameRegions.length > 0
                                ? AssetState.Tagged : (originalProject.visitedFrames.indexOf(frameName) > -1
                                ? AssetState.Visited : AssetState.NotVisited);
                    assetMetadata.asset.state = assetState;

                    /*
                    for (const region of frameRegions) {
                        generatedRegion = canvasHelpers.getRegion(region, "rect", region.UID)
                        generatedRegion.tags = region.tags.map((tag) => {
                                let newTag: ITag;
                                newTag = {
                                    name: tag,
                                    color: TagColors[(currentTagColorIndex + 1) % TagColors.length],
                                };
                                return newTag;
                            });
                    */

                    for (const region of frameRegions) {
                        generatedRegion = {
                            id: region.UID,
                            type: RegionType.Rectangle,
                            tags: region.tags.map((tag) => {
                                let newTag: ITag;
                                newTag = {
                                    name: tag,
                                    color: TagColors[(currentTagColorIndex + 1) % TagColors.length],
                                };
                                return newTag;
                            }),
                            points: region.points,
                            boundingBox: {
                                height: (region.x2 - region.x1),
                                width: (region.y2 - region.y1),
                                left: region.x1,
                                top: region.y1,
                            },
                        };
                        metadata.regions.push(generatedRegion);
                    }
                    return assetMetadata;
                });
                generatedAssetMetadata.push(assetMetadata);
            }
        }
        return generatedAssetMetadata;
    }
}
