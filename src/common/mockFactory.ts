import { AssetState, AssetType, IAsset, IConnection, IProject } from "../models/applicationState";
import { IAzureCloudStorageOptions } from "../providers/storage/azureBlobStorage";

export default class MockFactory {

    public static createTestAsset(name: string, assetState: AssetState = AssetState.NotVisited): IAsset {
        return {
            id: `asset-${name}`,
            format: "jpg",
            name: `Asset ${name}`,
            path: `C:\\Desktop\\asset${name}.jpg`,
            state: assetState,
            type: AssetType.Image,
            size: {
                width: 800,
                height: 600,
            },
        };
    }

    public static createTestAssets(count: number = 10): IAsset[] {
        const assets: IAsset[] = [];
        for (let i = 1; i <= count; i++) {
            assets.push(MockFactory.createTestAsset(i.toString()));
        }

        return assets;
    }

    public static createTestProjects(count: number = 10): IProject[] {
        const projects: IProject[] = [];
        for (let i = 1; i <= count; i++) {
            projects.push(MockFactory.createTestProject(i.toString()));
        }

        return projects;
    }

    public static createTestProject(name: string): IProject {
        const connection = MockFactory.createTestConnection(name);

        return {
            id: `project-${name}`,
            name: `Project ${name}`,
            assets: {},
            exportFormat: null,
            sourceConnection: connection,
            sourceConnectionId: connection.id,
            targetConnection: connection,
            targetConnectionId: connection.id,
            tags: [],
            autoSave: true,
        };
    }

    public static azureOptions(): IAzureCloudStorageOptions {
        return {
            accountName: "myaccount",
            containerName: "container",
            createContainer: false,
        };
    }

    public static listContainersResponse() {
        return {
            containerItems: MockFactory.azureContainers(),
            nextMarker: null,
        };
    }

    public static azureContainers(count: number= 3) {
        const result = [];
        for (let i = 0; i < count; i++) {
            result.push({
                name: `container${i}`,
                blobs: MockFactory.azureBlobs(i),
            });
        }
        return {containerItems: result};
    }

    public static fakeAzureData() {
        return {
            blobName: "file1.jpg",
            blobText: "This is the content",
            fileType: "image/jpg",
            containerName: "container",
            containers: this.azureContainers(),
            blobs: this.azureBlobs(),
            options: this.azureOptions(),
        };
    }

    public static blob(name: string, content: string | Buffer, fileType: string): Blob {
        const blob = new Blob([content], { type: fileType });
        blob["name"] = name;
        return blob;
    }

    public static azureBlobs(id: number= 1, count: number= 10) {
        const result = [];
        for (let i = 0; i < count; i++) {
            result.push({
                name: `blob-${id}-${i}.jpg`,
            });
        }
        return {segment: {blobItems: result}};
    }
    public static createTestConnections(count: number = 10): IConnection[] {
        const connections: IConnection[] = [];
        for (let i = 1; i <= count; i++) {
            connections.push(MockFactory.createTestConnection(i.toString()));
        }

        return connections;
    }

    public static createTestConnection(name: string, providerType: string = "test"): IConnection {
        return {
            id: `connection-${name}`,
            name: `Connection ${name}`,
            description: `Description for Connection ${name}`,
            providerType,
            providerOptions: {},
        };
    }
}
