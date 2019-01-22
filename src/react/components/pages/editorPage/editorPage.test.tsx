import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import { mount, ReactWrapper } from "enzyme";
import { Store, AnyAction } from "redux";
import EditorPage, { IEditorPageProps } from "./editorPage";
import { AssetProviderFactory } from "../../../../providers/storage/assetProviderFactory";
import { IApplicationState, IProject, IAssetMetadata } from "../../../../models/applicationState";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import createReduxStore from "../../../../redux/store/store";
import MockFactory from "../../../../common/mockFactory";
import { AssetService } from "../../../../services/assetService";

jest.mock("../../../../services/projectService");
import ProjectService from "../../../../services/projectService";
import { KeyCodes } from "../../../../common/utils";

describe("Editor Page Component", () => {
    let assetServiceMock: jest.Mocked<typeof AssetService> = null;
    let projectServiceMock: jest.Mocked<typeof ProjectService> = null;

    function createComponent(store, props: IEditorPageProps): ReactWrapper {
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
        const props = MockFactory.editorPageProps(testProject.id);
        const loadProjectSpy = jest.spyOn(props.actions, "loadProject");

        const wrapper = createComponent(store, props);
        const editorPage = wrapper.find(EditorPage).childAt(0);

        expect(loadProjectSpy).not.toBeCalled();
        expect(editorPage.prop("project")).toEqual(testProject);
    });

    it("Loads project assets when state changes", (done) => {
        const testProject = MockFactory.createTestProject("TestProject");
        const testAssets = MockFactory.createTestAssets(5);
        const store = createStore(testProject, true);
        const props = MockFactory.editorPageProps(testProject.id);

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

        const wrapper = createComponent(store, props);
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
        const props = MockFactory.editorPageProps(testProject.id);

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
        createComponent(store, props);

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

    it("calls onTagClick handler when hot key is pressed", () => {
        const project = MockFactory.createTestProject();
        const store = createReduxStore({
            ...MockFactory.initialState(),
            currentProject: project,
        });
        const props = MockFactory.editorPageProps();
        const wrapper = createComponent(store, props);

        const editorPage = wrapper.find(EditorPage).childAt(0);
        const spy = jest.spyOn(editorPage.instance() as EditorPage, "onTagClicked");

        const keyPressed = 2;
        (editorPage.instance() as EditorPage).handleTagHotKey({ctrlKey: true, key: keyPressed.toString()});
        expect(spy).toBeCalledWith(project.tags[keyPressed - 1]);
    });
});

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
