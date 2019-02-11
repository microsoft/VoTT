import shortid from "shortid";
import { IProject, ISecurityToken, IAppSettings, ITag, IConnection,
         IV1Project, IAssetMetadata, IRegion, RegionType, AssetType, AssetState, ITagMetadata } from "../models/applicationState";
import { generateKey } from "../../src/common/crypto";
import { AssetService } from "./assetService";
import MD5 from "md5.js";
import { randomIntInRange } from "../common/utils"
const TagColors = require("../react/components/common/tagsInput/tagColors.json");

/**
 * Functions required for an import service
 * @member convertV1 - Converts a v1 project to v2 project
 * @member generateAssets - Generates v2 assets based on v1 project file
 * @member generateConnections - Generates v2 connections based on location of v1 project file
 */
export interface IImportService {
    convertV1(project: any): Promise<IProject>;
}

/**
 * @name - Import Service
 * @description - Functions for importing v1 projects to v2 application
 */
// change any to { content, file } object eventually
export default class ImportService implements IImportService {
    public convertV1(project: any): Promise<IProject> {
        return new Promise<IProject>((resolve, reject) => {
            let originalProject: IV1Project;
            let convertedProject: IProject
            let connections: IConnection[];
            let tags: ITag[];
            let generatedAssetMetadata: IAssetMetadata[];

            originalProject = JSON.parse(project.content);
            tags = this.parseTags(originalProject);

            connections = this.generateConnections(project);
            generatedAssetMetadata = this.generateAssets(project);

            // map v1 values to v2 values
            convertedProject = {
                id: shortid.generate(),
                name: project.file.name.split(".")[0],
                version: "v1-to-v2",
                securityToken: `${project.file.name.split(".")[0]} Token`,
                description: "Converted V1 Project",
                tags: tags,
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

            const saveAssets = generatedAssetMetadata.map((assetMetadata) => {
                return assetService.save(assetMetadata);
            });
            
            try {
                Promise.all(saveAssets);
            } catch (e) {
                reject(e);
            }
            
            resolve(convertedProject);
        });
    }

    /**
     * Generate connections from v1 project file location
     * @param project - V1 Project Content and File Information
     */
    private generateConnections(project: any): IConnection[] {
        const sourceConnection: IConnection = {
            id: shortid.generate(),
            name: "Source Default Name",
            providerType: "localFileSystemProxy",
            providerOptions: {
                folderPath: project.file.path.replace(/[^\/]*$/,""),
            }
        };

        const targetConnection: IConnection = {
            id: shortid.generate(),
            name: "Target Default Name",
            providerType: "localFileSystemProxy",
            providerOptions: {
                folderPath: project.file.path.replace(/[^\/]*$/,""),
            },
        };

        let connections: IConnection[] = [sourceConnection, targetConnection];

        return(connections); 
    }

    /**
     * Parse v1 project's tag string and return array of ITags
     * @param project - V1 Project Content and File Information
     */
    private parseTags(project: any): ITag[] {
        let finalTags: ITag[] = [];
        const tagStrings = project.inputTags.split(",");
        const tagColors = project.tag_colors;

        for(let i=0;i<tagColors.length;i++){
            let newTag = {
                name: tagStrings[i],
                color: tagColors[i],
            }
            finalTags.push(newTag);
        }
        return finalTags;
    }

    /**
     * Generate assets based on V1 Project frames and regions
     * @param project - V1 Project Content and File Information
     */
    private generateAssets(project: any): IAssetMetadata[] {
        let originalProject: IV1Project;
        let assetMetadata: IAssetMetadata;
        let generatedAssetMetadata: IAssetMetadata[] = [];
        let generatedRegion: IRegion;
        let assetState: AssetState;
        let currentTagColorIndex = randomIntInRange(0, TagColors.length);

        originalProject = JSON.parse(project.content);

        for (let frameName in originalProject.frames){
            let v1Frames = originalProject.frames[frameName];
            assetState = originalProject.visitedFrames.indexOf(frameName) > -1 && v1Frames.length > 0
                         ? AssetState.Tagged : (originalProject.visitedFrames.indexOf(frameName) > -1 
                         ? AssetState.Visited : AssetState.NotVisited);

            assetMetadata = {
                asset: {
                    id: new MD5().update(frameName).digest("hex"),
                    type: AssetType.Image,
                    state: assetState,
                    name: frameName,
                    // check on Windows too
                    path: `file:${project.file.path.replace(/[^\/]*$/,"")}${frameName}`,
                    size: {
                        width: v1Frames.length > 0 ? v1Frames[0].width : null,
                        height: v1Frames.length > 0 ? v1Frames[0].height : null,
                    },
                    format: frameName.split(".").pop(),
                },
                regions: []
            }

            for(let i=0;i<v1Frames.length;i++){
                generatedRegion = {
                    id: v1Frames[i].UID,
                    type: RegionType.Rectangle,
                    tags: v1Frames[i].tags.map((tag) => {
                        let newTag = {
                            name: tag,
                            color: (currentTagColorIndex + 1) % TagColors.length,
                        }
                        return newTag;
                    }),
                    points: v1Frames[i].points,
                    boundingBox: {
                        height: (v1Frames[i].x2 - v1Frames[i].x1),
                        width: (v1Frames[i].y2 - v1Frames[i].y1),
                        left: v1Frames[i].x1,
                        top: v1Frames[i].y1,
                    }
                }
                assetMetadata.regions.push(generatedRegion);
            }
            generatedAssetMetadata.push(assetMetadata);
        }
        return generatedAssetMetadata;
    }
}