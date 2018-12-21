import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import { mount, ReactWrapper } from "enzyme";
import { Store, AnyAction } from "redux";
import EditorPage, { IEditorPageProps } from "./editorPage";
import { AssetProviderFactory } from "../../../../providers/storage/assetProvider";
import { IApplicationState, IProject, IAssetMetadata } from "../../../../models/applicationState";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import createReduxStore from "../../../../redux/store/store";
import MockFactory from "../../../../common/mockFactory";
import { AssetService } from "../../../../services/assetService";

jest.mock("../../../../services/projectService");
import ProjectService from "../../../../services/projectService";

describe("Editor Page Component", () => {
    let assetServiceMock: jest.Mocked<typeof AssetService> = null;
    let projectServiceMock: jest.Mocked<typeof ProjectService> = null;

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
        assetServiceMock = AssetService as jest.Mocked<typeof AssetService>;
        assetServiceMock.prototype.getAssetMetadata = jest.fn((asset) => {
            const assetMetadata: IAssetMetadata = {
                asset: { ...asset },
                regions: [],
                timestamp: null,
            };
            return Promise.resolve(assetMetadata);
        });

        projectServiceMock = ProjectService as jest.Mocked<typeof ProjectService>;
        projectServiceMock.prototype.save = jest.fn((project) => Promise.resolve({ ...project }));

        AssetProviderFactory.create = jest.fn(() => {
            return {
                getAssets: jest.fn(() => Promise.resolve([])),
            };
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

    it("Loads project assets when state changes", (done) => {
        const testProject = MockFactory.createTestProject("TestProject");
        const testAssets = MockFactory.createTestAssets(5);
        const store = createStore(testProject, true);
        const props = createProps(testProject.id);

        AssetProviderFactory.create = jest.fn(() => {
            return {
                getAssets: jest.fn(() => Promise.resolve(testAssets)),
            };
        });

        let savedAssetMetadata: IAssetMetadata = null;

        assetServiceMock.prototype.save = jest.fn((assetMetadata) => {
            savedAssetMetadata = { ...assetMetadata };
            return Promise.resolve(savedAssetMetadata);
        });

        const wrapper = createCompoent(store, props);
        const editorPage = wrapper.find(EditorPage).childAt(0);

        const partialProject = {
            id: testProject.id,
            name: testProject.name,
        };

        setImmediate(() => {
            expect(editorPage.prop("project")).toEqual(expect.objectContaining(partialProject));
            expect(editorPage.state("assets").length).toEqual(testAssets.length);
            expect(editorPage.state("selectedAsset")).toEqual(savedAssetMetadata);
            done();
        });
    });

    it("Raises onAssetSelected handler when an asset is selected from the sidebar", (done) => {
        // create test project and asset
        const testProject = MockFactory.createTestProject("TestProject");
        const testAssets = MockFactory.createTestAssets(5);
        const defaultAsset = testAssets[0];

        // mock store and props
        const store = createStore(testProject, true);
        const props = createProps(testProject.id);

        // mock out the asset provider create method
        AssetProviderFactory.create = jest.fn(() => {
            return {
                getAssets: jest.fn(() => Promise.resolve(testAssets)),
            };
        });

        let savedAssetMetadata: IAssetMetadata = null;

        // mock out the asset service save method
        assetServiceMock.prototype.save = jest.fn((assetMetadata) => {
            savedAssetMetadata = { ...assetMetadata };
            return Promise.resolve(savedAssetMetadata);
        });

        const loadAssetMetadataSpy = jest.spyOn(props.actions, "loadAssetMetadata");
        const saveAssetMetadataSpy = jest.spyOn(props.actions, "saveAssetMetadata");
        const saveProjectSpy = jest.spyOn(props.actions, "saveProject");

        // create mock editor page
        createCompoent(store, props);

        const partialProject = {
            id: testProject.id,
            name: testProject.name,
        };

        setImmediate(() => {
            expect(loadAssetMetadataSpy).toBeCalledWith(expect.objectContaining(partialProject), defaultAsset);
            expect(saveAssetMetadataSpy).toBeCalledWith(expect.objectContaining(partialProject), savedAssetMetadata);
            expect(saveProjectSpy).toBeCalledWith(expect.objectContaining(partialProject));
            done();
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
            path: `https://localhost:3000/projects/${projectId}/edit`,
            url: `https://localhost:3000/projects/${projectId}/edit`,
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
