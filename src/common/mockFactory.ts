import _ from "lodash";
import { AssetState, IAsset, AssetType, IProject } from "../models/applicationState";

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

    public static createTestProject(): IProject {
        return {
            id: "project-1",
            name: "Project 1",
            assets: {},
            exportFormat: null,
            sourceConnection: {
                id: "connection-1",
                name: "Connection 1",
                providerType: "test",
                providerOptions: {},
            },
            targetConnection: {
                id: "connection-1",
                name: "Connection 1",
                providerType: "test",
                providerOptions: {},
            },
            tags: [],
            autoSave: true,
        };
    }
}
