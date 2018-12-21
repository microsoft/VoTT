import { IProjectSettingsPageProps } from "../react/components/pages/projectSettings/projectSettingsPage";
import IConnectionActions from "../redux/actions/connectionActions";
import IProjectActions, * as projectActions from "../redux/actions/projectActions";
import { IProjectService } from "../services/projectService";
import {
    AssetState,
    AssetType,
    IApplicationState,
    IAppSettings,
    IAsset,
    IAssetMetadata,
    IConnection,
    IExportFormat,
    IProject,
    ITag,
} from "../models/applicationState";
import { VottExportAssetState } from "../providers/export/vottJson";
import { IAssetProvider } from "../providers/storage/assetProvider";

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

    public static createTestAssetMetadata(asset: IAsset): IAssetMetadata {
        return {
            asset,
            regions: [],
            timestamp: null,
        };
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
            exportFormat: MockFactory.exportFormat(),
            sourceConnection: connection,
            targetConnection: connection,
            tags: MockFactory.createTestTags(),
            autoSave: true,
        };
    }

    public static createTestTags(count: number = 5): ITag[] {
        const tags: ITag[] = [];
        for (let i = 1; i < count; i++) {
            tags.push(MockFactory.createTestTag(i.toString()));
        }

        return tags;
    }

    public static createTestTag(name: string): ITag {
        return {
            name: `Tag ${name}`,
            color: MockFactory.randomColor(),
        };
    }

    public static createTestConnections(count: number = 10): IConnection[] {
        const connections: IConnection[] = [];
        for (let i = 1; i <= count; i++) {
            connections.push(MockFactory.createTestConnection(i.toString()));
        }

        return connections;
    }

    public static createTestConnection(name: string, providerType: string = "localFileSystemProxy"): IConnection {
        return {
            id: `connection-${name}`,
            name: `Connection ${name}`,
            description: `Description for Connection ${name}`,
            providerType,
            providerOptions: {},
        };
    }

    public static createAssetProvider(): IAssetProvider {
        return {
            getAssets(containerName?: string): Promise<IAsset[]> {
                throw new Error("Method not implemented.");
            },
        };
    }

    public static exportFormat(): IExportFormat {
        return {
            providerType: "vottJson",
            providerOptions: {
                assetState: VottExportAssetState.Tagged,
            },
        };
    }

    public static projectService(): IProjectService {
        return {
            save: jest.fn((project: IProject) => Promise.resolve()),
            delete: jest.fn((project: IProject) => Promise.resolve()),
        };
    }

    public static projectActions(): IProjectActions {
        return {
            loadProject: jest.fn((project: IProject) => Promise.resolve()),
            saveProject: jest.fn((project: IProject) => Promise.resolve()),
            deleteProject: jest.fn((project: IProject) => Promise.resolve()),
            closeProject: jest.fn(() => Promise.resolve()),
            loadAssets: jest.fn((project: IProject) => Promise.resolve()),
            exportProject: jest.fn((project: IProject) => Promise.resolve()),
            loadAssetMetadata: jest.fn((project: IProject, asset: IAsset) => Promise.resolve()),
            saveAssetMetadata: jest.fn((project: IProject, assetMetadata: IAssetMetadata) => Promise.resolve()),
        };
    }

    public static connectionActions(): IConnectionActions {
        return {
            loadConnection: jest.fn((connection: IConnection) => Promise.resolve()),
            saveConnection: jest.fn((connection: IConnection) => Promise.resolve()),
            deleteConnection: jest.fn((connection: IConnection) => Promise.resolve()),
        };
    }

    public static appSettings(): IAppSettings {
        const testConnection = MockFactory.createTestConnection("Test");

        return {
            devToolsEnabled: false,
            connection: testConnection,
            connectionId: testConnection.id,
        };
    }

    public static projectSettingsProps(projectId?: string): IProjectSettingsPageProps {
        return {
            project: null,
            recentProjects: MockFactory.createTestProjects(),
            actions: (projectActions as any) as IProjectActions,
            connections: MockFactory.createTestConnections(),
            history: this.history(),
            location: this.location(),
            match: this.match(projectId),
        };
    }

    public static initialState(): IApplicationState {
        const testProjects = MockFactory.createTestProjects();
        const testConnections = MockFactory.createTestConnections();

        return {
            appSettings: MockFactory.appSettings(),
            connections: testConnections,
            recentProjects: testProjects,
            currentProject: testProjects[0],
        };
    }

    public static match(projectId?: string) {
        return {
            params: {
                projectId,
            },
            isExact: true,
            path: `https://localhost:3000/projects/${projectId}/export`,
            url: `https://localhost:3000/projects/${projectId}/export`,
        };
    }

    public static history() {
        return {
            length: 0,
            action: null,
            location: null,
            push: jest.fn(),
            replace: jest.fn(),
            go: jest.fn(),
            goBack: jest.fn(),
            goForward: jest.fn(),
            block: jest.fn(),
            listen: jest.fn(),
            createHref: jest.fn(),
        };
    }

    public static location() {
        return {
            hash: null,
            pathname: null,
            search: null,
            state: null,
        };
    }

    private static randomColor(): string {
        return [
            "#",
            MockFactory.randomColorSegment(),
            MockFactory.randomColorSegment(),
            MockFactory.randomColorSegment(),
        ].join("");
    }

    private static randomColorSegment(): string {
        const num = Math.floor(Math.random() * 255);
        return num.toString(16);
    }
}
