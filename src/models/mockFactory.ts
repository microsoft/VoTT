import ProjectSettingsPage,
{ IProjectSettingsPageProps } from "../react/components/pages/projectSettings/projectSettingsPage";
import { IProject, IConnection, IExportFormat,
    ITag, IAsset, IApplicationState, IAppSettings,
    IAssetMetadata, ISize } from "../models/applicationState";
import { IProjectService } from "../services/projectService";
import IProjectActions from "../redux/actions/projectActions";
import IConnectionActions, { loadConnection, deleteConnection } from "../redux/actions/connectionActions";

export class MockFactory {
    public tags(): ITag[] {
        return [
            {
                name: "Tag1",
                color: "#FFFFFF",
            },
            {
                name: "Tag2",
                color: "#FFFF00",
            },
        ];
    }

    public connection(): IConnection {
        return {
            id: "connectionId",
            name: "My new connection",
            description: "This is my description",
            providerType: "localFileSystemProxy",
            providerOptions: {
                folderPath: "my path",
            },
        };
    }

    public connections(): IConnection[] {
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

    public exportFormat(): IExportFormat {
        return {
            providerType: "Fake",
            providerOptions: {},
        };
    }

    public project(): IProject {
        return this.recentProjects()[0];
    }

    public recentProjects(): IProject[] {
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

    public projectService(): IProjectService {
        return {
            get: jest.fn((id: string) => Promise.resolve()),
            getList: jest.fn(() => Promise.resolve()),
            save: jest.fn((project: IProject) => Promise.resolve()),
            delete: jest.fn((project: IProject) => Promise.resolve()),
        };
    }

    public projectActions(): IProjectActions {
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

    public connectionActions(): IConnectionActions {
        return {
            loadConnections: jest.fn(() => Promise.resolve()),
            loadConnection: jest.fn((connectionId: string) => Promise.resolve()),
            saveConnection: jest.fn((connectionId: string) => Promise.resolve()),
            deleteConnection: jest.fn((connectionId: string) => Promise.resolve()),
            closeConnection: jest.fn(() => Promise.resolve()),
        };
    }

    public appSettings(): IAppSettings {
        return {
            devToolsEnabled: false,
            connection: this.connections()[0],
            connectionId: this.connections()[0].id,
        };
    }

    public projectSettingsProps(projectId?: string): IProjectSettingsPageProps {
        return {
            project: null,
            projectActions: this.projectActions(),
            connectionActions: this.connectionActions(),
            connections: this.connections(),
            history: this.history(),
            location: this.location(),
            match: this.match(projectId),
        };
    }

    public initialState(): IApplicationState {
        return {
            appSettings: this.appSettings(),
            connections: this.connections(),
            recentProjects: this.recentProjects(),
            currentProject: this.recentProjects()[0],
        };
    }

    public match(projectId?: string) {
        return {
            params: {
                projectId,
            },
            isExact: true,
            path: `https://localhost:3000/projects/${projectId}/export`,
            url: `https://localhost:3000/projects/${projectId}/export`,
        };
    }

    public history() {
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

    public location() {
        return {
            hash: null,
            pathname: null,
            search: null,
            state: null,
        };
    }
}
