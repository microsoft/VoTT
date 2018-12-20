import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import _ from "lodash";
import { mount, ReactWrapper } from "enzyme";
import { Store, AnyAction } from "redux";
import EditorPage, { IEditorPageProps } from "./editorPage";
import { AssetProviderFactory } from "../../../../providers/storage/assetProvider";
import { IApplicationState, IProject, IAssetMetadata } from "../../../../models/applicationState";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import { AssetService } from "../../../../services/assetService";
import createReduxStore from "../../../../redux/store/store";
import MockFactory from "../../../../common/mockFactory";

jest.mock("../../../../services/projectService");
import ProjectService from "../../../../services/projectService";
import EditorSideBar from "./editorSideBar";

describe("Editor Page Component", () => {
    const assetServiceMock: jest.Mocked<typeof AssetService> = null;

    function createCompoent(store, props: IEditorPageProps): ReactWrapper {
        return mount(
            <Provider store={store}>
                <Router>
                    <EditorPage {...props} />
                </Router>
            </Provider>,
        );
    }

    beforeEach(() => {
        const assetServiceMock = AssetService as jest.Mocked<typeof AssetService>;
        assetServiceMock.prototype.getAssetMetadata = jest.fn((asset) => {
            const assetMetadata: IAssetMetadata = {
                asset,
                regions: [],
                timestamp: null,
            };
            return Promise.resolve(assetMetadata);
        });
    });

    it("Sets project state from redux store", () => {
        const testProject = MockFactory.createTestProject("TestProject");
        const store = createStore(testProject, true);
        const props = createProps(testProject.id);
        const loadProjectSpy = jest.spyOn(props.actions, "loadProject");

        const wrapper = createCompoent(store, props);
        const editorPage = wrapper.find(EditorPage).childAt(0);

        expect(loadProjectSpy).not.toBeCalled();
        expect(editorPage.prop("project")).toEqual(testProject);
    });

    it("Loads project assets when state changes", () => {
        const assetServiceMock = AssetService as jest.Mocked<typeof AssetService>;
        assetServiceMock.prototype.getAssetMetadata = jest.fn((asset) => {
            const assetMetadata: IAssetMetadata = {
                asset,
                regions: [],
                timestamp: null,
            };
            return Promise.resolve(assetMetadata);
        });
        const testProject = MockFactory.createTestProject("TestProject");
        const testAssets = MockFactory.createTestAssets(5);
        testProject.assets = _.keyBy(testAssets, "id");
        const store = createStore(testProject, true);
        const props = createProps(testProject.id);

        AssetProviderFactory.create = jest.fn(() => {
            return {
                export: jest.fn(() => Promise.resolve()),
            };
        });

        assetServiceMock.prototype.save = jest.fn((asset) => Promise.resolve(asset));

        const wrapper = createCompoent(store, props);
        const editorPage = wrapper.find(EditorPage).childAt(0);

        wrapper.setProps({
            project: testProject,
        });

        setImmediate(() => {
            expect(editorPage.prop("project")).toEqual(testProject);
            expect(editorPage.state("assets")).toEqual(testProject.assets);
        });
    });

    it("Raises onAssetSelected handler when an asset is selected from the sidebar", async () => {
        // register a test asset provider to retrieve assets
        AssetProviderFactory.register("testProvider", () => MockFactory.createAssetProvider());
        // create test project and asset
        const testProject = MockFactory.createTestProject("TestProject");
        const testAsset = MockFactory.createTestAsset("TestAsset");

        // mock store and props
        const store = createStore(testProject, true);
        const props = createProps(testProject.id);

        // mock out the asset provider create method
        AssetProviderFactory.create = jest.fn(() => {
            return {
                export: jest.fn(() => Promise.resolve()),
            };
        });

        // mock out the asset service save method
        assetServiceMock.prototype.save = jest.fn((asset) => Promise.resolve(asset));

        // create mock editor page
        const wrapper = createCompoent(store, props);
        const editorPage = wrapper.find(EditorPage).childAt(0);

        // set testAsset as selected asset, changing the state
        // which should raise onassetselected handler
        wrapper.setState({
            selectedAsset: testAsset,
        });

        // spy for onassetselected handler
        const editorSideBar = wrapper.find(EditorSideBar);
        const onAssetSelectedSpy = jest.spyOn(editorSideBar.props(), "onAssetSelected");

        setImmediate(() => {
            // expect mocked asset service to call get asset metadate with the mock asset
            expect(assetServiceMock.prototype.getAssetMetadata).toBeCalledWith(testAsset);
            // expect the spy to be called
            expect(onAssetSelectedSpy).toBeCalled();
        });
    });
});

function createProps(projectId: string): IEditorPageProps {
    return {
        project: null,
        recentProjects: [],
        history: {
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
        },
        location: {
            hash: null,
            pathname: null,
            search: null,
            state: null,
        },
        actions: (projectActions as any) as IProjectActions,
        match: {
            params: {
                projectId,
            },
            isExact: true,
            path: `https://localhost:3000/projects/${projectId}/export`,
            url: `https://localhost:3000/projects/${projectId}/export`,
        },
    };
}

function createStore(project: IProject, setCurrentProject: boolean = false): Store<any, AnyAction> {
    const initialState: IApplicationState = {
        currentProject: setCurrentProject ? project : null,
        appSettings: {
            connection: null,
            devToolsEnabled: false,
        },
        connections: [],
        recentProjects: [project],
    };

    return createReduxStore(initialState);
}
