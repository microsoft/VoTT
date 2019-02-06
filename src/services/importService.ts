import shortid from "shortid";
import { StorageProviderFactory } from "../providers/storage/storageProviderFactory";
import { AssetProviderFactory } from "../providers/storage/assetProviderFactory";
import { IProject, ISecurityToken, IAsset, ITag, IConnection, IV1Project } from "../models/applicationState";
// import Guard from "../common/guard";
// import { constants } from "../common/constants";
// import { ExportProviderFactory } from "../providers/export/exportProviderFactory";
// import { decryptProject, encryptProject } from "../common/utils";
import ConnectionService from "./connectionService";
import { generateKey } from "../../src/common/crypto";

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

            connections = this.generateConnections(originalProject);

            originalProject = JSON.parse(project.content);

            tags = this.parseTags(originalProject);

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

            console.log("CONVERTED PROJECT:" + convertedProject);
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

    // CHECK THIS TO MAKE SURE IT WORKS!
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
}
