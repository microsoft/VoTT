import { AssetState, AssetType, IApplicationState, IAppSettings,
    IAsset, IAssetMetadata, IConnection, IExportFormat, IProject, ITag } from "../models/applicationState";
import { IProjectSettingsPageProps } from "../react/components/pages/projectSettings/projectSettingsPage";
import IConnectionActions from "../redux/actions/connectionActions";
import IProjectActions, * as projectActions from "../redux/actions/projectActions";
import { IProjectService } from "../services/projectService";

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

    public static connections(): IConnection[] {
        return [
            {
                id: "1",
                name: "My source connection",
                description: "This is my connection",
                providerType: "azureBlobStorage",
                providerOptions: {
                    connectionString: "myconnectionstring",
                    containerName: "container",
                    createContainer: true,
                },
            },
            {
                id: "2",
                name: "My target connection",
                description: "This is my connection",
                providerType: "localFileSystemProxy",
                providerOptions: {
                    folderPath: "my path",
                },
            },
        ];
    }

    public static exportFormat(): IExportFormat {
        return {
            providerType: "Fake",
            providerOptions: {},
        };
    }

    public static project(): IProject {
        return this.recentProjects()[0];
    }

    public static recentProjects(): IProject[] {
        const connections = this.connections();

        return [
            {
                id: "project1",
                name: "Test Project",
                description: "This is my project",
                tags: this.tags(),
                sourceConnection: connections[0],
                sourceConnectionId: connections[0].id,
                targetConnection: connections[1],
                targetConnectionId: connections[1].id,
                exportFormat: this.exportFormat(),
                autoSave: true,
            },
            {
                id: "project2",
                name: "Test Project 2",
                description: "This is my other project",
                tags: this.tags(),
                sourceConnection: connections[0],
                sourceConnectionId: connections[0].id,
                targetConnection: connections[1],
                targetConnectionId: connections[1].id,
                exportFormat: this.exportFormat(),
                autoSave: true,
            },
        ];
    }

    public static projectService(): IProjectService {
        return {
            get: jest.fn((id: string) => Promise.resolve()),
            getList: jest.fn(() => Promise.resolve()),
            save: jest.fn((project: IProject) => Promise.resolve()),
            delete: jest.fn((project: IProject) => Promise.resolve()),
        };
    }

    public static projectActions(): IProjectActions {
        return {
            loadProjects: jest.fn(() => Promise.resolve()),
            loadProject: jest.fn((value: IProject | string) => Promise.resolve()),
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
            loadConnections: jest.fn(() => Promise.resolve()),
            loadConnection: jest.fn((connectionId: string) => Promise.resolve()),
            saveConnection: jest.fn((connectionId: string) => Promise.resolve()),
            deleteConnection: jest.fn((connectionId: string) => Promise.resolve()),
            closeConnection: jest.fn(() => Promise.resolve()),
        };
    }

    public static appSettings(): IAppSettings {
        return {
            devToolsEnabled: false,
            connection: this.connections()[0],
            connectionId: this.connections()[0].id,
        };
    }

    public static projectSettingsProps(projectId?: string): IProjectSettingsPageProps {
        return {
            project: null,
            projectActions: (projectActions as any) as IProjectActions,
            connectionActions: this.connectionActions(),
            connections: this.connections(),
            history: this.history(),
            location: this.location(),
            match: this.match(projectId),
        };
    }

    public static initialState(): IApplicationState {
        return {
            appSettings: this.appSettings(),
            connections: this.connections(),
            recentProjects: this.recentProjects(),
            currentProject: this.recentProjects()[0],
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
}
