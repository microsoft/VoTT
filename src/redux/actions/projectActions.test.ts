import createMockStore, { MockStoreEnhanced } from "redux-mock-store";
import { ActionTypes } from "./actionTypes";
import * as projectActions from "./projectActions";
import MockFactory from "../../common/mockFactory";
import thunk from "redux-thunk";

jest.mock("../../services/projectService");
import ProjectService from "../../services/projectService";

jest.mock("../../services/assetService");
import { AssetService } from "../../services/assetService";
import { ExportProviderFactory } from "../../providers/export/exportProviderFactory";
import { ExportAssetState, IExportProvider } from "../../providers/export/exportProvider";
import { IApplicationState } from "../../models/applicationState";
import initialState from "../store/initialState";
import { appInfo } from "../../common/appInfo";

describe("Project Redux Actions", () => {
    let store: MockStoreEnhanced<IApplicationState>;
    let projectServiceMock: jest.Mocked<typeof ProjectService>;
    const appSettings = MockFactory.appSettings();

    beforeEach(() => {
        const middleware = [thunk];
        const mockState: IApplicationState = {
            ...initialState,
            appSettings,
        };
        store = createMockStore<IApplicationState>(middleware)(mockState);
        projectServiceMock = ProjectService as jest.Mocked<typeof ProjectService>;
        projectServiceMock.prototype.load = jest.fn((project) => Promise.resolve(project));
    });

    it("Load Project action resolves a promise and dispatches redux action", async () => {
        const project = MockFactory.createTestProject("TestProject");
        const projectToken = appSettings.securityTokens
            .find((securityToken) => securityToken.name === project.securityToken);

        const result = await projectActions.loadProject(project)(store.dispatch, store.getState);
        const actions = store.getActions();

        expect(actions.length).toEqual(1);
        expect(actions[0]).toEqual({
            type: ActionTypes.LOAD_PROJECT_SUCCESS,
            payload: project,
        });
        expect(result).toEqual(project);
        expect(projectServiceMock.prototype.load).toBeCalledWith(project, projectToken);
    });

    it("Save Project action calls project service and dispatches redux action", async () => {
        projectServiceMock.prototype.save = jest.fn((project) => Promise.resolve(project));

        const project = MockFactory.createTestProject("TestProject");
        const projectToken = appSettings.securityTokens
            .find((securityToken) => securityToken.name === project.securityToken);

        const result = await projectActions.saveProject(project)(store.dispatch, store.getState);
        const actions = store.getActions();

        expect(actions.length).toEqual(2);
        expect(actions[0]).toEqual({
            type: ActionTypes.SAVE_PROJECT_SUCCESS,
            payload: project,
        });
        expect(actions[1]).toEqual({
            type: ActionTypes.LOAD_PROJECT_SUCCESS,
            payload: project,
        });
        expect(result).toEqual(project);
        expect(projectServiceMock.prototype.save).toBeCalledWith(project, projectToken);
        expect(projectServiceMock.prototype.load).toBeCalledWith(project, projectToken);
    });

    it("Save Project action correctly add project version", async () => {
        projectServiceMock.prototype.save = jest.fn((project) => Promise.resolve(project));

        const project = MockFactory.createTestProject("TestProject");
        const result = await projectActions.saveProject(project)(store.dispatch, store.getState);

        expect(result.version).toEqual(appInfo.version);
    });

    it("Save Project action on new project correctly add default export format", async () => {
        projectServiceMock.prototype.save = jest.fn((project) => Promise.resolve(project));

        const skeletonProject = MockFactory.createTestProject("TestProject");
        const project = {
            ...skeletonProject,
            exportFormat: null,
        };

        const result = await projectActions.saveProject(project)(store.dispatch, store.getState);

        expect(result.exportFormat).toEqual({
            providerType: "vottJson",
            providerOptions: {
                assetState: ExportAssetState.Visited,
            },
        });
    });

    it("Save Project action does not override existing export format", async () => {
        projectServiceMock.prototype.save = jest.fn((project) => Promise.resolve(project));

        const project = MockFactory.createTestProject("TestProject");
        const result = await projectActions.saveProject(project)(store.dispatch, store.getState);

        const expectedExportFormat = MockFactory.exportFormat();

        expect(result.exportFormat).toEqual(expectedExportFormat);
    });

    it("Delete Project action calls project service and dispatches redux action", async () => {
        projectServiceMock.prototype.delete = jest.fn(() => Promise.resolve());

        const project = MockFactory.createTestProject("TestProject");
        await projectActions.deleteProject(project)(store.dispatch, store.getState);
        const actions = store.getActions();

        expect(actions.length).toEqual(1);
        expect(actions[0]).toEqual({
            type: ActionTypes.DELETE_PROJECT_SUCCESS,
            payload: project,
        });
        expect(projectServiceMock.prototype.delete).toBeCalledWith(project);
    });

    it("Delete project with missing security token throws error", async () => {
        const project = MockFactory.createTestProject("ProjectWithoutToken");
        await expect(projectActions.deleteProject(project)(store.dispatch, store.getState)).rejects.not.toBeNull();

        const actions = store.getActions();
        expect(actions.length).toEqual(0);
    });

    it("Close project dispatches redux action", () => {
        projectActions.closeProject()(store.dispatch);
        const actions = store.getActions();

        expect(actions.length).toEqual(1);
        expect(actions[0]).toEqual({
            type: ActionTypes.CLOSE_PROJECT_SUCCESS,
        });
    });

    it("Load Assets calls asset service and dispatches redux action", async () => {
        const testAssets = MockFactory.createTestAssets(10);
        const mockAssetService = AssetService as jest.Mocked<typeof AssetService>;
        mockAssetService.prototype.getAssets = jest.fn(() => Promise.resolve(testAssets));

        const project = MockFactory.createTestProject("TestProject");
        const results = await projectActions.loadAssets(project)(store.dispatch);
        const actions = store.getActions();

        expect(actions.length).toEqual(1);
        expect(actions[0]).toEqual({
            type: ActionTypes.LOAD_PROJECT_ASSETS_SUCCESS,
            payload: testAssets,
        });

        expect(mockAssetService.prototype.getAssets).toBeCalled();
        expect(results).toEqual(testAssets);
    });

    it("Load Asset metadata calls asset service and dispatches redux action", async () => {
        const asset = MockFactory.createTestAsset("Asset1");
        const assetMetadata = MockFactory.createTestAssetMetadata(asset);
        const mockAssetService = AssetService as jest.Mocked<typeof AssetService>;
        mockAssetService.prototype.getAssetMetadata = jest.fn(() => assetMetadata);

        const project = MockFactory.createTestProject("TestProject");
        const result = await projectActions.loadAssetMetadata(project, asset)(store.dispatch);
        const actions = store.getActions();

        expect(actions.length).toEqual(1);
        expect(actions[0]).toEqual({
            type: ActionTypes.LOAD_ASSET_METADATA_SUCCESS,
            payload: assetMetadata,
        });

        expect(mockAssetService.prototype.getAssetMetadata).toBeCalledWith(asset);
        expect(result).toEqual(assetMetadata);
    });

    it("Save Asset metadata calls asset service and dispatches redux action", async () => {
        const asset = MockFactory.createTestAsset("Asset1");
        const assetMetadata = MockFactory.createTestAssetMetadata(asset);
        const mockAssetService = AssetService as jest.Mocked<typeof AssetService>;
        mockAssetService.prototype.save = jest.fn(() => assetMetadata);

        const project = MockFactory.createTestProject("TestProject");
        const result = await projectActions.saveAssetMetadata(project, assetMetadata)(store.dispatch);
        const actions = store.getActions();

        expect(actions.length).toEqual(1);
        expect(actions[0]).toEqual({
            type: ActionTypes.SAVE_ASSET_METADATA_SUCCESS,
            payload: assetMetadata,
        });

        expect(mockAssetService.prototype.save).toBeCalledWith(assetMetadata);
        expect(result).toEqual(assetMetadata);
    });

    it("Save Asset metadata correctly add project version", async () => {
        const asset = MockFactory.createTestAsset("Asset1");
        const assetMetadata = MockFactory.createTestAssetMetadata(asset);
        const mockAssetService = AssetService as jest.Mocked<typeof AssetService>;
        mockAssetService.prototype.save = jest.fn(() => assetMetadata);

        const project = MockFactory.createTestProject("TestProject");
        const result = await projectActions.saveAssetMetadata(project, assetMetadata)(store.dispatch);

        expect(result.version).toEqual(appInfo.version);
    });

    it("Export project calls export provider and dispatches redux action", async () => {
        const mockExportProvider: IExportProvider = {
            project: null,
            export: jest.fn(() => Promise.resolve()),
        };
        ExportProviderFactory.create = jest.fn(() => mockExportProvider);

        const project = MockFactory.createTestProject("TestProject");
        await projectActions.exportProject(project)(store.dispatch);
        const actions = store.getActions();

        expect(actions.length).toEqual(1);
        expect(actions[0]).toEqual({
            type: ActionTypes.EXPORT_PROJECT_SUCCESS,
            payload: project,
        });

        expect(ExportProviderFactory.create).toBeCalledWith(
            project.exportFormat.providerType,
            project,
            project.exportFormat.providerOptions,
        );

        expect(mockExportProvider.export).toHaveBeenCalled();
    });
});
