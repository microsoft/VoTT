import { mount, ReactWrapper } from "enzyme";
import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import { AnyAction, Store } from "redux";
import MockFactory from "../../../../common/mockFactory";
import { EditorMode, IApplicationState, IAssetMetadata, IProject } from "../../../../models/applicationState";
import { AssetProviderFactory } from "../../../../providers/storage/assetProviderFactory";
import createReduxStore from "../../../../redux/store/store";
import registerToolbar from "../../../../registerToolbar";
import { AssetService } from "../../../../services/assetService";
import ProjectService from "../../../../services/projectService";
import { DrawPolygon } from "../../toolbar/drawPolygon";
import EditorPage, { IEditorPageProps } from "./editorPage";

jest.mock("../../../../services/projectService");

function createCompoent(store, props: IEditorPageProps): ReactWrapper {
    return mount(
        <Provider store={store}>
            <Router>
                <EditorPage {...props} />
            </Router>
        </Provider>,
    );
}

function getState(wrapper) {
    return wrapper.find(EditorPage).childAt(0).state();
}

describe("Editor Page Component", () => {
    let assetServiceMock: jest.Mocked<typeof AssetService> = null;
    let projectServiceMock: jest.Mocked<typeof ProjectService> = null;

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
        const props = MockFactory.editorPageSettingsProps(testProject.id);
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
        const props = MockFactory.editorPageSettingsProps(testProject.id);

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
        const props = MockFactory.editorPageSettingsProps(testProject.id);

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

    describe("Editor Page Toolbar integration", () => {

    beforeAll(() => {
        registerToolbar();
    });

    it("clicking polygon mode button changes mode", () => {
        const project = MockFactory.createTestProject();
        const store = createReduxStore({
            ...MockFactory.initialState(),
            currentProject: project,
        });
        const wrapper = createCompoent(store, MockFactory.editorPageSettingsProps());
        const poly = wrapper.find(DrawPolygon).first();
        expect(poly.exists()).toBe(true);
        poly.find("button").simulate("click");
        expect(getState(wrapper).mode).toEqual(EditorMode.Polygon);
    });
});

    describe("Editor Page Footer integration", () => {
    });

    describe("Basic tag interaction tests", () => {
        it("tags are initialized correctly", () => {
            const project = MockFactory.createTestProject();
            const store = createReduxStore({
                ...MockFactory.initialState(),
                currentProject: project,
            });
            const wrapper = createCompoent(store, MockFactory.editorPageSettingsProps());
            expect(getState(wrapper).project.tags).toEqual(project.tags);
        });

        it("create a new tag from text box", () => {
            const project = MockFactory.createTestProject();
            const store = createReduxStore({
                ...MockFactory.initialState(),
                currentProject: project,
            });
            const wrapper = createCompoent(store, MockFactory.editorPageSettingsProps());
            expect(getState(wrapper).project.tags).toEqual(project.tags);

            const newTagName = "My new tag";
            wrapper.find("input.ReactTags__tagInputField").simulate("change", { target: { value: newTagName } });
            wrapper.find("input.ReactTags__tagInputField").simulate("keyDown", { keyCode: 13 });

            const stateTags = getState(wrapper).project.tags;

            expect(stateTags).toHaveLength(project.tags.length + 1);
            expect(stateTags[stateTags.length - 1].name).toEqual(newTagName);
        });

        it("remove a tag", () => {
            const project = MockFactory.createTestProject();
            const store = createReduxStore({
                ...MockFactory.initialState(),
                currentProject: project,
            });

            const wrapper = createCompoent(store, MockFactory.editorPageSettingsProps());
            expect(getState(wrapper).project.tags).toEqual(project.tags);
            wrapper.find("a.ReactTags__remove")
                .last().simulate("click");

            const stateTags = getState(wrapper).project.tags;
            expect(stateTags).toHaveLength(project.tags.length - 1);
        });

        it("calls onTagClick handler when hot key is pressed", () => {
            const project = MockFactory.createTestProject();

            const store = createReduxStore({
                ...MockFactory.initialState(),
                currentProject: project,
            });

            const props = MockFactory.editorPageSettingsProps();
            const wrapper = createCompoent(store, props);

            const editorPage = wrapper.find(EditorPage).childAt(0);
            const spy = jest.spyOn(editorPage.instance() as EditorPage, "onTagClicked");

            const keyPressed = 2;
            (editorPage.instance() as EditorPage).handleTagHotKey({ctrlKey: true, key: keyPressed.toString()});
            expect(spy).toBeCalledWith(project.tags[keyPressed - 1]);
        });

    })
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

