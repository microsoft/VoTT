import shortid from "shortid";
import {
    AssetState, AssetType, IApplicationState, IAppSettings, IAsset, IAssetMetadata,
    IConnection, IExportFormat, IProject, ITag, StorageType, ISecurityToken,
    EditorMode, IAppError, IProjectVideoSettings, AppError, ErrorCode,
    IPoint, IRegion, RegionType, IBoundingBox } from "../models/applicationState";
import { IV1Project, IV1Region } from "../models/v1Models";
import { ExportAssetState } from "../providers/export/exportProvider";
import { IAssetProvider, IAssetProviderRegistrationOptions } from "../providers/storage/assetProviderFactory";
import { IAzureCloudStorageOptions } from "../providers/storage/azureBlobStorage";
import { IStorageProvider, IStorageProviderRegistrationOptions } from "../providers/storage/storageProviderFactory";
import { IExportProviderRegistrationOptions } from "../providers/export/exportProviderFactory";
import { IProjectSettingsPageProps } from "../react/components/pages/projectSettings/projectSettingsPage";
import IConnectionActions from "../redux/actions/connectionActions";
import IProjectActions, * as projectActions from "../redux/actions/projectActions";
import { IProjectService } from "../services/projectService";
import Canvas, { ICanvasProps } from "../react/components/pages/editorPage/canvas";
import { IBingImageSearchOptions, BingImageSearchAspectRatio } from "../providers/storage/bingImageSearch";
import { IEditorPageProps } from "../react/components/pages/editorPage/editorPage";
import {
    IAzureCustomVisionTag, IAzureCustomVisionRegion,
} from "../providers/export/azureCustomVision/azureCustomVisionService";
import IApplicationActions, * as applicationActions from "../redux/actions/applicationActions";
import { ILocalFileSystemProxyOptions } from "../providers/storage/localFileSystemProxy";
import { generateKey } from "./crypto";
import { AssetService } from "../services/assetService";
import { SelectionMode } from "vott-ct/lib/js/CanvasTools/Selection/AreaSelector";
import { Point2D } from "vott-ct/lib/js/CanvasTools/Core/Point2D";
import { RegionDataType, RegionData } from "vott-ct/lib/js/CanvasTools/Core/RegionData";
import { randomIntInRange } from "./utils";
import { appInfo } from "./appInfo";

export default class MockFactory {

    /**
     * Creates sample IAppError
     * @param errorCode The error code to map to the error
     * @param title The title of the error
     * @param message The detailed error message
     * @returns {IAppError}
     */
    public static createAppError(
        errorCode: ErrorCode = ErrorCode.Unknown,
        title: string = "",
        message: string = ""): IAppError {
        return {
            errorCode,
            title,
            message,
        };
    }

    /**
     * Creates fake IAsset
     * @param name Name of asset
     * @param assetState State of asset
     * @param path Path of asset
     * @param assetType Type of asset
     */
    public static createTestAsset(
        name: string = "test",
        assetState: AssetState = AssetState.NotVisited,
        path: string = `C:\\Desktop\\asset${name}.jpg`,
        assetType: AssetType = AssetType.Image,
        timestamp: number = 0): IAsset {
        let testAsset = null;
        switch (assetType) {
            case AssetType.Video:
                testAsset = {
                    id: `videoasset-${name}`,
                    format: "mp4",
                    name: `videoasset${name}`,
                    path: `C:\\Desktop\\videoasset${name}.mp4`,
                    state: assetState,
                    type: AssetType.Video,
                    size: {
                        width: 800,
                        height: 600,
                    },
                };
                break;
            case AssetType.VideoFrame:
                testAsset = {
                    id: `videoasset-${name}#t=${timestamp}`,
                    format: "mp4",
                    name: `videoasset${name}.mp4#t=${timestamp}`,
                    path: `C:\\Desktop\\videoasset${name}.mp4#t=${timestamp}`,
                    state: assetState,
                    type: AssetType.VideoFrame,
                    size: {
                        width: 800,
                        height: 600,
                    },
                    parent: {
                        id: `videoasset-${name}`,
                        format: "mp4",
                        name: `videoasset${name}`,
                        path: `C:\\Desktop\\videoasset${name}.mp4`,
                        state: assetState,
                        type: AssetType.Video,
                        size: {
                            width: 800,
                            height: 600,
                        },
                    },
                };
                break;
            case AssetType.Image:
                testAsset = {
                    id: `asset-${name}`,
                    format: "jpg",
                    name: `Asset ${name}.jpg`,
                    path: `${path}`,
                    state: assetState,
                    type: assetType,
                    size: {
                        width: 800,
                        height: 600,
                    },
                };
                break;
            default:
                testAsset = {
                    id: `asset-${name}`,
                    format: "?",
                    name: `Asset ${name}.asset`,
                    path: `${path}`,
                    state: assetState,
                    type: assetType,
                    size: {
                        width: 800,
                        height: 600,
                    },
                };
        }

        return testAsset;
    }

    /**
     * Creates fake IAsset
     * @param name Name of asset
     * @param assetState State of asset
     */
    public static createWebTestAsset(name: string, assetState: AssetState = AssetState.NotVisited): IAsset {
        return MockFactory.createTestAsset(name, assetState, `https://image.com/asset${name}.jpg`);
    }

    /**
     * @name Create Video Test Asset
     * @description Creates fake video IAsset
     * @param name Name of asset
     * @param assetState State of asset
     */
    public static createVideoTestAsset(name: string, assetState: AssetState = AssetState.NotVisited): IAsset {
        return {
            id: `videoasset-${name}`,
            format: "mp4",
            name: `videoasset${name}`,
            path: `C:\\Desktop\\videoasset${name}.mp4`,
            state: assetState,
            type: AssetType.Video,
            size: {
                width: 800,
                height: 600,
            },
        };
    }

    /**
     * Creates a child videoFrame asset from a parent video asset
     * @param rootAsset The parent video asset
     * @param timestamp The timestamp to generate child asset
     */
    public static createChildVideoAsset(rootAsset: IAsset, timestamp: number): IAsset {
        const childPath = `${rootAsset.path}#t=${timestamp}`;
        const childAsset = AssetService.createAssetFromFilePath(childPath);
        childAsset.type = AssetType.VideoFrame;
        childAsset.state = AssetState.Tagged;
        childAsset.parent = rootAsset;
        childAsset.timestamp = timestamp;
        childAsset.size = { ...rootAsset.size };

        return childAsset;
    }

    /**
     * Creates an array of child video frame assets from a parent video asset
     * @param rootAsset The parent video asset
     * @param count The number of child assets to create (default 10)
     */
    public static createChildVideoAssets(rootAsset: IAsset, count: number = 10): IAsset[] {
        return [...Array(count).keys()].map((index) => {
            return this.createChildVideoAsset(rootAsset, index);
        });
    }

    /**
     * Creates array of fake IAsset
     * @param count Number of assets to create (default: 10)
     * @param startIndex The index that the assets should start at (default: 1)
     */
    public static createTestAssets(count: number = 10, startIndex: number = 1): IAsset[] {
        const assets: IAsset[] = [];
        for (let i = startIndex; i < (count + startIndex); i++) {
            assets.push(MockFactory.createTestAsset(i.toString()));
        }

        return assets;
    }

    /**
     * Creates array of fake IAsset with different protocols
     * @param count Number of assets to create
     */
    public static createMixProtocolTestAssets(): IAsset[] {
        const assets: IAsset[] = [];
        assets.push(MockFactory.createTestAsset("0"));
        assets.push(MockFactory.createWebTestAsset("1"));

        return assets;
    }

    /**
     * Creates fake IAssetMetadata
     * @param asset Test asset
     */
    public static createTestAssetMetadata(asset: IAsset, regions?: IRegion[]): IAssetMetadata {
        return {
            asset,
            regions: regions || [],
            version: appInfo.version,
        };
    }

    /**
     * Creates array of fake IProject
     * @param count Number of projects
     */
    public static createTestProjects(count: number = 10): IProject[] {
        const projects: IProject[] = [];
        for (let i = 1; i <= count; i++) {
            projects.push(MockFactory.createTestProject(i.toString()));
        }

        return projects;
    }

    /**
     * Creates fake IProject
     * @param name Name of project. project.id = `project-${name}` and project.name = `Project ${name}`
     * @param tagCount number of tags to create for project
     */
    public static createTestProject(name: string = "test", tagCount: number = 5): IProject {
        const connection = MockFactory.createTestConnection(name);

        return {
            id: `project-${name}`,
            name: `Project ${name}`,
            version: appInfo.version,
            securityToken: `Security-Token-${name}`,
            assets: {},
            exportFormat: MockFactory.exportFormat(),
            sourceConnection: connection,
            targetConnection: connection,
            tags: MockFactory.createTestTags(tagCount),
            videoSettings: MockFactory.createVideoSettings(),
            autoSave: true,
        };
    }

    /**
     * Creates fake IV1Project
     * @param name Name of project.
     */
    public static createTestV1Project(frameCount: number = 10): IV1Project {
        const frames: { [frameName: string]: IV1Region[]; } = {};
        for (let i = 0; i < frameCount; i++) {
            const name = `testFrame${i}.jpg`;
            frames[name] = MockFactory.createTestV1Regions();
        }

        return {
            frames,
            framerate: "1",
            inputTags: "testTag1,testTag2",
            suggestiontype: "suggestiontype",
            scd: true,
            visitedFrames: ["testFrame0.jpg"],
            tag_colors: [MockFactory.randomColor(), MockFactory.randomColor()],
        };
    }

    /**
     * Creates fake IV1Region
     */
    public static createTestV1Regions(count: number = 3): IV1Region[] {
        const regions: IV1Region[] = [];
        const left = randomIntInRange(0, 511);
        const top = randomIntInRange(0, 383);
        const right = randomIntInRange(512, 1024);
        const bottom = randomIntInRange(384, 786);

        for (let i = 0; i < count; i++) {
            const testRegion = {
                x1: left,
                y1: top,
                x2: right,
                y2: bottom,
                width: 10,
                height: 10,
                box: {
                    x1: left,
                    y1: top,
                    x2: right,
                    y2: bottom },
                points: [],
                UID: i.toString(),
                id: 2,
                type: "rect",
                tags: [],
                name: 1,
            };
            regions.push(testRegion);
        }
        return regions;
    }

    /**
     * Creates fake IProjectVideoSettings with default values
     */
    public static createVideoSettings(): IProjectVideoSettings {
        return { frameExtractionRate: 15 };
    }

    /**
     * Creates fake IAzureCloudStorageOptions
     */
    public static createAzureOptions(): IAzureCloudStorageOptions {
        return {
            accountName: "myaccount",
            containerName: "container0",
            sas: "sas",
            createContainer: undefined,
        };
    }

    public static createLocalFileSystemOptions(): ILocalFileSystemProxyOptions {
        return {
            folderPath: "C:\\projects\\vott\\project",
        };
    }

    /**
     * Creates fake response for Azure Blob Storage `listContainers` function
     */
    public static createAzureStorageListContainersResponse() {
        return {
            containerItems: MockFactory.createAzureContainers(),
            nextMarker: null,
        };
    }

    /**
     * Creates fake Azure containers
     * @param count Number of containers
     */
    public static createAzureContainers(count: number = 3) {
        const result = [];
        for (let i = 0; i < count; i++) {
            result.push({
                name: `container${i}`,
                blobs: MockFactory.createAzureBlobs(i),
            });
        }
        return { containerItems: result };
    }

    /**
     * Creates fake data for testing Azure Cloud Storage
     */
    public static createAzureData() {
        const options = MockFactory.createAzureOptions();
        return {
            blobName: "file1.jpg",
            blobText: "This is the content",
            fileType: "image/jpg",
            containerName: options.containerName,
            containers: MockFactory.createAzureContainers(),
            blobs: MockFactory.createAzureBlobs(),
            options,
        };
    }

    /**
     * Creates fake Blob object
     * @param name Name of blob
     * @param content Content of blob
     * @param fileType File type of blob
     */
    public static blob(name: string, content: string | Buffer, fileType: string): Blob {
        const blob = new Blob([content], { type: fileType });
        blob["name"] = name;
        return blob;
    }

    /**
     * Creates fake Azure Blobs
     * @param id ID of blob
     * @param count Number of blobs
     */
    public static createAzureBlobs(id: number = 1, count: number = 10) {
        const result = [];
        for (let i = 0; i < count; i++) {
            result.push({
                name: `blob-${id}-${i}.jpg`,
            });
        }
        return { segment: { blobItems: result } };
    }

    /**
     * Create array of fake ITag
     * @param count Number of tags
     */
    public static createTestTags(count: number = 5): ITag[] {
        const tags: ITag[] = [];
        for (let i = 0; i < count; i++) {
            tags.push(MockFactory.createTestTag(i.toString()));
        }
        return tags;
    }

    /**
     * Create fake ITag with random color
     * @param name Name of tag
     */
    public static createTestTag(name: string = "1"): ITag {
        return {
            name: `Tag ${name}`,
            color: MockFactory.randomColor(),
        };
    }

    /**
     * Create array of IConnection, half Azure Blob connections, half Local File Storage connections
     * @param count Number of connections
     */
    public static createTestConnections(count: number = 10): IConnection[] {
        const connections: IConnection[] = [];
        for (let i = 1; i <= (count / 2); i++) {
            connections.push(MockFactory.createTestCloudConnection(i.toString()));
        }
        for (let i = (count / 2) + 1; i <= count; i++) {
            connections.push(MockFactory.createTestConnection(i.toString()));
        }
        return connections;
    }

    /**
     *
     * @param name Name of connection
     */
    public static createTestCloudConnection(name: string = "test"): IConnection {
        return MockFactory.createTestConnection(name, "azureBlobStorage");
    }

    /**
     * Create array of IConnection of type Bing Image Search
     * @param count Number of connections
     */
    public static createTestBingConnections(count: number = 10): IConnection[] {
        const connections: IConnection[] = [];
        for (let i = 1; i <= count; i++) {
            connections.push(MockFactory.createTestConnection(i.toString(), "bingImageSearch"));
        }
        return connections;
    }

    /**
     * Create fake IConnection
     * @param name Name of connection - default test
     * @param providerType Type of Connection - default local file system
     */
    public static createTestConnection(
        name: string = "test", providerType: string = "localFileSystemProxy"): IConnection {
        return {
            id: `connection-${name}`,
            name: `Connection ${name}`,
            description: `Description for Connection ${name}`,
            providerType,
            providerOptions: MockFactory.getProviderOptions(providerType),
        };
    }

    /**
     * Create fake IBingImageSearchOptions
     */
    public static createBingOptions(): IBingImageSearchOptions {
        return {
            apiKey: "key",
            aspectRatio: BingImageSearchAspectRatio.All,
            query: "test",
        };
    }

    /**
     * Get options for asset provider
     * @param providerType asset provider type
     */
    public static getProviderOptions(providerType) {
        switch (providerType) {
            case "localFileSystemProxy":
                return MockFactory.createLocalFileSystemOptions();
            case "azureBlobStorage":
                return MockFactory.createAzureOptions();
            case "bingImageSearch":
                return MockFactory.createBingOptions();
            default:
                return {};
        }
    }

    /**
     * Create array of filename strings
     */
    public static createFileList(): string[] {
        return ["file1.jpg", "file2.jpg", "file3.jpg"];
    }

    /**
     * Create fake Storage Provider of storage type Cloud
     * All functions are jest.fn to test for being called
     * readText resolves to "Fake text"
     * listFiles resolves with list of fake files
     */
    public static createStorageProvider(): IStorageProvider {
        return {
            storageType: StorageType.Cloud,

            initialize: jest.fn(() => Promise.resolve()),
            readText: jest.fn(() => Promise.resolve("Fake text")),
            readBinary: jest.fn(),
            deleteFile: jest.fn(),
            writeText: jest.fn(),
            writeBinary: jest.fn(),
            listFiles: jest.fn(() => Promise.resolve(MockFactory.createFileList())),
            listContainers: jest.fn(),
            createContainer: jest.fn(),
            deleteContainer: jest.fn(),
            getAssets: jest.fn(),
        };
    }

    /**
     * Creates a storage provider from IConnection
     * @param connection Connection with which to create Storage Provider
     */
    public static createStorageProviderFromConnection(connection: IConnection): IStorageProvider {
        return {
            ...MockFactory.createStorageProvider(),
            storageType: MockFactory.getStorageType(connection.providerType),
        };
    }

    /**
     * Create fake asset provider
     */
    public static createAssetProvider(): IAssetProvider {
        return {
            initialize: jest.fn(() => Promise.resolve()),
            getAssets(containerName?: string): Promise<IAsset[]> {
                throw new Error("Method not implemented.");
            },
        };
    }

    /**
     * Create fake IExportFormat of provider type vottJson
     */
    public static exportFormat(): IExportFormat {
        return {
            providerType: "vottJson",
            providerOptions: {
                assetState: ExportAssetState.Tagged,
            },
        };
    }

    /**
     * Creates array of IExportProviderRegistrationOptions for the different providers
     * vottJson, tensorFlowPascalVOC, azureCustomVision
     */
    public static createExportProviderRegistrations(): IExportProviderRegistrationOptions[] {
        const registrations: IExportProviderRegistrationOptions[] = [];
        registrations.push(MockFactory.createExportProviderRegistration("vottJson"));
        registrations.push(MockFactory.createExportProviderRegistration("tensorFlowPascalVOC"));
        registrations.push(MockFactory.createExportProviderRegistration("azureCustomVision"));

        return registrations;
    }

    /**
     * Create array of IStorageProviderRegistrationOptions
     * @param count Number of storage provider registrations to create
     */
    public static createStorageProviderRegistrations(count: number = 10): IStorageProviderRegistrationOptions[] {
        const registrations: IStorageProviderRegistrationOptions[] = [];
        for (let i = 1; i <= count; i++) {
            registrations.push(MockFactory.createStorageProviderRegistration(i.toString()));
        }

        return registrations;
    }

    /**
     * Create array of IAssetProviderRegistrationOptions
     * @param count Number of Asset Provider Registrations to create
     */
    public static createAssetProviderRegistrations(count: number = 10): IAssetProviderRegistrationOptions[] {
        const registrations: IAssetProviderRegistrationOptions[] = [];
        for (let i = 1; i <= count; i++) {
            registrations.push(MockFactory.createAssetProviderRegistration(i.toString()));
        }

        return registrations;
    }

    /**
     *
     * @param name
     */
    public static createExportProviderRegistration(name: string) {
        const registration: IExportProviderRegistrationOptions = {
            name,
            displayName: `${name} display name`,
            description: `${name} short description`,
            factory: () => null,
        };

        return registration;
    }

    /**
     * Creates fake IStorageProviderRegistrationOptions
     * @param name Name of Storage Provider
     */
    public static createStorageProviderRegistration(name: string) {
        const registration: IStorageProviderRegistrationOptions = {
            name,
            displayName: `${name} display name`,
            description: `${name} short description`,
            factory: () => null,
        };

        return registration;
    }

    public static createTestCanvas(project: IProject = null) {
        const canvasProps: ICanvasProps = {
            project,
            selectedAsset: this.createTestAssetMetadata(this.createTestAsset("test-asset")),
            onAssetMetadataChanged: jest.fn(),
            editorMode: EditorMode.Rectangle,
            selectionMode: SelectionMode.RECT,
            children: null,
            lockedTags: [],
        };
        return new Canvas(canvasProps);
    }

    /**
     * Creates an array of test regions
     * @param count The number of regions to create (deafult: 5)
     */
    public static createTestRegions(count: number = 5) {
        const regions: IRegion[] = [];
        for (let i = 1; i <= count; i++) {
            regions.push(MockFactory.createTestRegion(`test${i}`));
        }
        return regions;
    }

    /**
     * Creates a test region with the optional specified id
     * @param id The id to assign to the region
     * @param tags the tags used in this region
     */
    public static createTestRegion(id = null, tags: string[] = []): IRegion {
        const origin = {
            x: randomIntInRange(0, 1024),
            y: randomIntInRange(0, 768),
        };
        const size = {
            width: randomIntInRange(1, 100),
            height: randomIntInRange(1, 100),
        };

        return {
            id,
            boundingBox: {
                left: origin.x,
                top: origin.y,
                width: size.width,
                height: size.height,
            },
            points: [
                { x: origin.x, y: origin.y }, // Top left
                { x: origin.x + size.width, y: origin.y }, // Top Right
                { x: origin.x, y: origin.y + size.height }, // Bottom Left
                { x: origin.x + size.width, y: origin.y + size.height }, // Bottom Right
            ],
            tags,
            type: RegionType.Rectangle,
        };
    }

    /**
     * Creates a random test canvas tool RegionData
     */
    public static createTestRegionData() {
        const origin = {
            x: randomIntInRange(0, 1024),
            y: randomIntInRange(0, 768),
        };
        const size = {
            width: randomIntInRange(1, 100),
            height: randomIntInRange(1, 100),
        };

        return new RegionData(origin.x, origin.y, size.width, size.height,
            [
                new Point2D(origin.x, origin.y), // Top left
                new Point2D(origin.x + size.width, origin.y), // Top Right
                new Point2D(origin.x, origin.y + size.height), // Bottom Left
                new Point2D(origin.x + size.width, origin.y + size.height), // Bottom Right
            ],
            RegionDataType.Rect);
    }
    /**
     * Creates fake IAssetProviderRegistrationOptions
     * @param name Name of asset provider
     */
    public static createAssetProviderRegistration(name: string) {
        const registration: IAssetProviderRegistrationOptions = {
            name,
            displayName: `${name} display name`,
            description: `${name} short description`,
            factory: () => null,
        };

        return registration;
    }

    /**
     * Creates fake IProjectService
     */
    public static projectService(): IProjectService {
        return {
            load: jest.fn((project: IProject) => Promise.resolve(project)),
            save: jest.fn((project: IProject) => Promise.resolve(project)),
            delete: jest.fn((project: IProject) => Promise.resolve()),
            isDuplicate: jest.fn((project: IProject, projectList: IProject[]) => true),
        };
    }

    /**
     * Creates fake IProjectActions with jest functions for each action
     */
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

    /**
     * Creates fake IConnectionActions with jest functions for each action
     */
    public static connectionActions(): IConnectionActions {
        return {
            loadConnection: jest.fn((connection: IConnection) => Promise.resolve()),
            saveConnection: jest.fn((connection: IConnection) => Promise.resolve()),
            deleteConnection: jest.fn((connection: IConnection) => Promise.resolve()),
        };
    }

    /**
     * Creates fake IAppSettings
     */
    public static appSettings(): IAppSettings {
        const securityTokens = MockFactory.createSecurityTokens();

        return {
            devToolsEnabled: false,
            securityTokens: [
                ...securityTokens,
                MockFactory.createSecurityToken("TestProject"),
                MockFactory.createSecurityToken("test"),
            ],
        };
    }

    /**
     * Creates a security token used for testing
     * @param nameSuffix The name suffix to apply to the security token name
     */
    public static createSecurityToken(nameSuffix: string): ISecurityToken {
        return {
            name: `Security-Token-${nameSuffix}`,
            key: generateKey(),
        };
    }

    /**
     * Creates test security tokens
     * @param count The number of tokens to generate (default: 10)
     */
    public static createSecurityTokens(count: number = 10): ISecurityToken[] {
        const securityTokens: ISecurityToken[] = [];
        for (let i = 1; i <= 10; i++) {
            securityTokens.push(MockFactory.createSecurityToken(i.toString()));
        }

        return securityTokens;
    }

    /**
     * Creates fake IProjectSettingsPageProps
     * @param projectId Current project ID
     */
    public static projectSettingsProps(projectId?: string): IProjectSettingsPageProps {
        return {
            ...MockFactory.pageProps(projectId, "settings"),
            connections: MockFactory.createTestConnections(),
            appSettings: MockFactory.appSettings(),
        };
    }

    /**
     * Creates fake IEditorPageProps
     * @param projectId Current project ID
     */
    public static editorPageProps(projectId?: string): IEditorPageProps {
        return {
            actions: (projectActions as any) as IProjectActions,
            ...MockFactory.pageProps(projectId, "edit"),
        };
    }

    /**
     * Creates fake IApplicationState
     */
    public static initialState(state?: any): IApplicationState {
        const testProjects = MockFactory.createTestProjects();
        const testConnections = MockFactory.createTestConnections();

        return {
            appSettings: MockFactory.appSettings(),
            connections: testConnections,
            recentProjects: testProjects,
            currentProject: testProjects[0],
            ...state,
            appError: null,
        };
    }

    /**
     * Runs function that updates the UI, and flushes call stack
     * @param func - The function that updates the UI
     */
    public static flushUi(func: () => void = null): Promise<void> {
        return new Promise<void>((resolve) => {
            if (func) {
                func();
            }
            setImmediate(resolve);
        });
    }

    /**
     * Runs and waits for a condidtion to be met and resolves a promise
     * @param predicate The predicate to evaluate the condition
     * @param interval The interval to check the value
     */
    public static waitForCondition(predicate: () => boolean, interval: number = 100): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const handle = setInterval(() => {
                try {
                    if (predicate()) {
                        clearInterval(handle);
                        resolve();
                    }
                } catch (e) {
                    reject(e);
                }
            }, interval);
        });
    }

    public static createAzureCustomVisionTags(count: number = 10): IAzureCustomVisionTag[] {
        const tags: IAzureCustomVisionTag[] = [];
        for (let i = 1; i <= count; i++) {
            tags.push(MockFactory.createAzureCustomVisionTag(`Tag ${i}`));
        }

        return tags;
    }

    public static createAzureCustomVisionTag(name: string): IAzureCustomVisionTag {
        return {
            id: shortid.generate(),
            name,
            description: `Description for ${name}`,
            imageCount: 0,
        };
    }

    public static createAzureCustomVisionRegions(count: number = 10): IAzureCustomVisionRegion[] {
        const regions: IAzureCustomVisionRegion[] = [];
        for (let i = 1; i <= count; i++) {
            regions.push(MockFactory.createAzureCustomVisionRegion());
        }

        return regions;
    }

    public static createAzureCustomVisionRegion(): IAzureCustomVisionRegion {
        return {
            imageId: shortid.generate(),
            tagId: shortid.generate(),
            left: 0,
            top: 0,
            width: 1,
            height: 1,
        };
    }

    private static pageProps(projectId: string, method: string) {
        return {
            project: null,
            recentProjects: MockFactory.createTestProjects(),
            projectActions: (projectActions as any) as IProjectActions,
            applicationActions: (applicationActions as any) as IApplicationActions,
            history: MockFactory.history(),
            location: MockFactory.location(),
            match: MockFactory.match(projectId, method),
        };
    }

    /**
     * Creates fake match for page properties
     * @param projectId Current project id
     * @param method URL method for project (export, edit, settings)
     */
    private static match(projectId: string, method: string) {
        return {
            params: {
                projectId,
            },
            isExact: true,
            path: `https://localhost:3000/projects/${projectId}/${method}`,
            url: `https://localhost:3000/projects/${projectId}/${method}`,
        };
    }

    /**
     * Creates fake history for page properties
     */
    private static history() {
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

    /**
     * Creates fake location for page properties
     */
    private static location() {
        return {
            hash: null,
            pathname: null,
            search: null,
            state: null,
        };
    }

    /**
     * Generates a random color string
     */
    private static randomColor(): string {
        return "#" + (Math.random() * 0xFFFFFF << 0).toString(16);
    }

    /**
     * Gets StorageType for asset providers
     * @param providerType Asset Providet type
     */
    private static getStorageType(providerType: string): StorageType {
        switch (providerType) {
            case "azureBlobStorage":
                return StorageType.Cloud;
            case "localFileSystemProxy":
                return StorageType.Local;
            default:
                return StorageType.Other;
        }
    }

}
