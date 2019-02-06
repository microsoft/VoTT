import shortid from "shortid";
import { StorageProviderFactory } from "../providers/storage/storageProviderFactory";
import { AssetProviderFactory } from "../providers/storage/assetProviderFactory";
import { IProject, ISecurityToken, IAsset, ITag, IConnection,
         IV1Project, IAssetMetadata, IRegion, RegionType, AssetType, AssetState } from "../models/applicationState";
// import Guard from "../common/guard";
// import { constants } from "../common/constants";
// import { ExportProviderFactory } from "../providers/export/exportProviderFactory";
// import { decryptProject, encryptProject } from "../common/utils";
import ConnectionService from "./connectionService";
import { generateKey } from "../../src/common/crypto";
import { Rect } from "vott-ct/lib/js/CanvasTools/Core/Rect";
import { Region } from "vott-ct/lib/js/CanvasTools/Region/Region";

/**
 * Functions required for an import service
 * @member convertV1 - Converts a v1 project to v2 project
 * @member generateAssets - Generates v2 assets based on v1 project file
 * @member generateConnections - Generates v2 connections based on location of v1 project file
 */
export interface IImportService {
    convertV1(project: IProject): Promise<IProject>;
    generateConnections(project: IProject, securityToken: ISecurityToken): Promise<IProject>;
}

/**
 * @name - Import Service
 * @description - Functions for importing v1 projects to v2 application
 */
// change any to { content, file } object eventually
export default class ImportService {
    public convertV1(project: any): Promise<IProject> {
        return new Promise<IProject>((resolve, reject) => {
            let originalProject: IV1Project;
            let convertedProject: IProject
            let connections: IConnection[];
            let dummyAsset: IAsset;
            let tags: ITag[];
            let assets: { [index: string] : IAsset };

            originalProject = JSON.parse(project.content);

            connections = this.generateConnections(originalProject);
            tags = this.parseTags(originalProject);

            assets = this.generateAssets(originalProject);

            // map v1 values to v2 values
            convertedProject = {
                id: shortid.generate(),
                name: project.file.name,
                securityToken: generateKey(),
                description: "Converted V1 Project",
                tags: tags,
                sourceConnection: connections[0],
                targetConnection: connections[1],
                exportFormat: null,
                videoSettings: {
                    frameExtractionRate: 15,
                },
                autoSave: true,
                // TODO: fill this array? (kind of):
                assets: { "index":  dummyAsset},
            };

            // call some create project method like from projectsettingspage
            // create security token (next line won't work)

            console.log(convertedProject);
            return convertedProject;
        });
    }

    private generateConnections(project: any): IConnection[] {
        const connectionService = new ConnectionService();

        const sourceConnection: IConnection = {
            id: shortid.generate(),
            name: "Source Default Name",
            providerType: "localFileSystemProxy",
            providerOptions: {
                encrypted: generateKey(),
            }
        };

        const targetConnection: IConnection = {
            id: shortid.generate(),
            name: "Target Default Name",
            providerType: "localFileSystemProxy",
            providerOptions: {
                encrypted: generateKey(),
            },
        };

        let connections: IConnection[] = [sourceConnection, targetConnection];

        return(connections); 
    }

    private parseTags(project: any): ITag[] {
        let finalTags: ITag[] = [];
        const tagStrings = project.inputTags.split(",");
        const tagColors = project.tag_colors;
        console.log(tagStrings);

        for(let i=0;i<tagColors.length;i++){
            let newTag = {
                name: tagStrings[i],
                color: tagColors[i],
            }
            finalTags.push(newTag);
        }
        return finalTags;
    }

    private generateAssets(project: any): { [index: string] : IAsset } {
        let assets: { [index: string] : IAsset };
        // let AssetMetadata: IAssetMetadata;
        let generatedMetadata: IAssetMetadata;
        let generatedRegion: IRegion;
        let shape: RegionType;
        // For regions in assets:
        // generate separate AssetMetadata objects:
        // SHAPE: frames: {[frameName: string] : IV1Frame[]};
        // export interface IAssetMetadata {
        //     asset: IAsset;
        //     regions: IRegion[];
        //     timestamp?: string;
        // }
        // export interface IRegion {
        //     id: string;
        //     type: RegionType;
        //     tags: ITagMetadata[];
        //     points?: IPoint[];
        //     boundingBox?: IBoundingBox;
        // }
        // export interface IAsset {
        //     id: string;
        //     type: AssetType;
        //     state: AssetState;
        //     name: string;
        //     path: string;
        //     size: ISize;
        //     format?: string;
        // }

        // "LOTR1.jpg":[  
        //     {  
        //        "x1":1575.5540166204985,
        //        "y1":489.75761772853184,
        //        "x2":1752.4930747922435,
        //        "y2":822.6038781163435,
        //        "width":1920,
        //        "height":1080,
        //        "box":{  
        //           "x1":1575.5540166204985,
        //           "y1":489.75761772853184,
        //           "x2":1752.4930747922435,
        //           "y2":822.6038781163435
        //        },
        //        "points":[  
        //           {  
        //              "x":1575.5540166204985,
        //              "y":489.90840517241384
        //           },
        //           {  
        //              "x":1752.4930747922438,
        //              "y":489.90840517241384
        //           },
        //           {  
        //              "x":1752.4930747922438,
        //              "y":822.8571428571429
        //           },
        //           {  
        //              "x":1575.5540166204985,
        //              "y":822.8571428571429
        //           }
        //        ],
        //        "UID":"c52b022e",
        //        "id":0,
        //        "type":"rect",
        //        "tags":[  
        //           "gandalf"
        //        ],
        //        "name":1
        //     },

        for (let frameName in project.frames){
            let v1Frames = project.frames[frameName];
            console.log(frameName);
            console.log(v1Frames);

            generatedMetadata = {
                asset: {
                    id: shortid.generate(),
                    type: AssetType.Image,
                    // have to check visited asset array in project.content
                    state: AssetState.Visited,
                    name: frameName,
                    // this may or may not be right--check on Windows too
                    path: `${project.file.path}/${frameName}`,
                    // how th am I suppoed to find this out?
                    size: {
                        width: 1500,
                        height: 1500,
                    },
                    //regex for file extension
                    format: frameName,
                },
                regions: []
            }
            // v1Frames = list of regions...why not length?
            for(let i=0;i<v1Frames.length;i++){
                switch(v1Frames[i].type){
                    case "rect":
                        shape = RegionType.Rectangle;
                    default:
                        shape = RegionType.Rectangle;
                }
                generatedRegion = {
                    id: v1Frames[i].UID,
                    type: shape,
                    // do I need to fill this in? one or the other?
                    tags: v1Frames[i].tags,
                    // points = 1:1 mapping
                    points: v1Frames[i].points,
                    // bounding box: height, width, left, top
                    boundingBox: {
                        height: v1Frames[i].height,
                        width: v1Frames[i].width,
                        left: v1Frames[i].x1,
                        top: v1Frames[i].y1,
                    }
                }
                generatedMetadata.regions.push(generatedRegion);
            }
            
            
            
        }
        
        // and call AssetService.save
        // to generate the JSON files in the target storage provider.

        return assets;
    }
}