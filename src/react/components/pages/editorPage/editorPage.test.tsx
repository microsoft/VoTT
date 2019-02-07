import { mount, ReactWrapper } from "enzyme";
import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import { AnyAction, Store } from "redux";
import MockFactory from "../../../../common/mockFactory";
import {
    IApplicationState, IAssetMetadata, IProject,
    EditorMode, IAsset, AssetState,
} from "../../../../models/applicationState";
import { AssetProviderFactory } from "../../../../providers/storage/assetProviderFactory";
import createReduxStore from "../../../../redux/store/store";
import { AssetService } from "../../../../services/assetService";
import ProjectService from "../../../../services/projectService";
import EditorPage, { IEditorPageProps, IEditorPageState } from "./editorPage";
jest.mock("vott-ct");
import { CanvasTools } from "vott-ct";
import registerToolbar from "../../../../registerToolbar";
import { DrawPolygon } from "../../toolbar/drawPolygon";
import { DrawRectangle } from "../../toolbar/drawRectangle";
import { Select } from "../../toolbar/select";
import { Pan } from "../../toolbar/pan";
import { Player } from "video-react";
import { KeyboardManager } from "../../common/keyboardManager/keyboardManager";
import { NextAsset } from "../../toolbar/nextAsset";
import { PreviousAsset } from "../../toolbar/previousAsset";

jest.mock("../../../../services/projectService");

function createComponent(store, props: IEditorPageProps): ReactWrapper<IEditorPageProps, {}, EditorPage> {
    return mount(
        <Provider store={store}>
            <KeyboardManager>
                <Router>
                    <EditorPage {...props} />
                </Router>
            </KeyboardManager>
        </Provider>,
    );
}

function getState(wrapper): IEditorPageState {
    return wrapper.find(EditorPage).childAt(0).state() as IEditorPageState;
}

describe("Editor Page Component", () => {
    let assetServiceMock: jest.Mocked<typeof AssetService> = null;
    let projectServiceMock: jest.Mocked<typeof ProjectService> = null;
    let videoPlayerPausedMock: jest.Mocked<typeof Player> = null;
    let videoPlayerUnpausedMock: jest.Mocked<typeof Player> = null;

    const testAssets: IAsset[] = MockFactory.createTestAssets(5);

    beforeAll(() => {
        const editorMock = CanvasTools.Editor as any;
        editorMock.prototype.RM = new CanvasTools.Region.RegionsManager(null, null, null);
        editorMock.prototype.scaleRegionToSourceSize = jest.fn((regionData: any) => regionData);
    });

    beforeEach(() => {
        assetServiceMock = AssetService as jest.Mocked<typeof AssetService>;
        assetServiceMock.prototype.getAssetMetadata = jest.fn((asset) => {
            const assetMetadata: IAssetMetadata = {
                asset: { ...asset },
                regions: [MockFactory.createMockRegion()],
            };
            return Promise.resolve(assetMetadata);
        });
        assetServiceMock.prototype.save = jest.fn((assetMetadata) => {
            return Promise.resolve({ ...assetMetadata });
        });

        projectServiceMock = ProjectService as jest.Mocked<typeof ProjectService>;
        projectServiceMock.prototype.save = jest.fn((project) => Promise.resolve({ ...project }));
        projectServiceMock.prototype.load = jest.fn((project) => Promise.resolve({ ...project }));

        AssetProviderFactory.create = jest.fn(() => {
            return {
                getAssets: jest.fn(() => Promise.resolve(testAssets)),
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
        const store = createStore(testProject, true);
        const props = MockFactory.editorPageProps(testProject.id);

        videoPlayerPausedMock = Player as jest.Mocked<typeof Player>;
        videoPlayerPausedMock.prototype.subscribeToStateChange = jest.fn((callback) => {
            // Set up some state that is unpaused
            const state = {
                paused: true,
                waiting: false,
                hasStarted: true,
            };
            callback(state, state);
        });

        const wrapper = createComponent(store, props);
        const editorPage = wrapper.find(EditorPage).childAt(0) as ReactWrapper<IEditorPageProps, IEditorPageState>;

        const partialProject = {
            id: testProject.id,
            name: testProject.name,
        };

        const expectedAssetMetadtata: IAssetMetadata = {
            asset: {
                ...testAssets[0],
                state: AssetState.Visited,
            },
            regions: [MockFactory.createMockRegion()],
        };

        setImmediate(() => {
            expect(editorPage.props().project).toEqual(expect.objectContaining(partialProject));
            expect(editorPage.state().assets.length).toEqual(testAssets.length);
            expect(editorPage.state().selectedAsset).toEqual(expectedAssetMetadtata);
            done();
        });
    });

    it("Raises onAssetSelected handler when an asset is selected from the sidebar", (done) => {
        // create test project and asset
        const testProject = MockFactory.createTestProject("TestProject");
        const defaultAsset = testAssets[0];

        // mock store and props
        const store = createStore(testProject, true);
        const props = MockFactory.editorPageProps(testProject.id);

        videoPlayerUnpausedMock = Player as jest.Mocked<typeof Player>;
        videoPlayerUnpausedMock.prototype.subscribeToStateChange = jest.fn((callback) => {
            // Set up some state that is unpaused
            const state = {
                paused: false,
                waiting: false,
                hasStarted: true,
            };
            callback(state, state);
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

        const expectedAssetMetadtata: IAssetMetadata = {
            asset: {
                ...testAssets[0],
                state: AssetState.Visited,
            },
            regions: [MockFactory.createMockRegion()],
        };

        setImmediate(() => {
            expect(loadAssetMetadataSpy).toBeCalledWith(expect.objectContaining(partialProject), defaultAsset);
            expect(saveAssetMetadataSpy).toBeCalledWith(
                expect.objectContaining(partialProject),
                expectedAssetMetadtata,
            );
            expect(saveProjectSpy).toBeCalledWith(expect.objectContaining(partialProject));
            done();
        });
    });

    describe("Basic toolbar test", () => {
        let wrapper: ReactWrapper = null;

        beforeAll(() => {
            registerToolbar();
        });

        beforeEach(async () => {
            const testProject = MockFactory.createTestProject("TestProject");
            const store = createStore(testProject, true);
            const props = MockFactory.editorPageProps(testProject.id);

            wrapper = createComponent(store, props);

            await MockFactory.waitForCondition(() => {
                const editorPage = wrapper
                    .find(EditorPage)
                    .childAt(0) as ReactWrapper<IEditorPageProps, IEditorPageState>;

                return !!editorPage.state().selectedAsset;
            });
        });

        it("editor mode is changed correctly", async () => {
            wrapper.find(DrawPolygon).simulate("click");
            expect(getState(wrapper).mode).toEqual(EditorMode.Polygon);

            wrapper.find(DrawRectangle).simulate("click");
            expect(getState(wrapper).mode).toEqual(EditorMode.Rectangle);

            wrapper.find(Select).simulate("click");
            expect(getState(wrapper).mode).toEqual(EditorMode.Select);

            wrapper.find(Pan).simulate("click");
            expect(getState(wrapper).mode).toEqual(EditorMode.Select);
        });

        it("selects the next asset when clicking the 'Next Asset' button in the toolbar", async () => {
            await MockFactory.flushUi(() => wrapper.find(NextAsset).simulate("click")); // Move to Asset 2

            wrapper.update();

            const expectedAssetMetadtata: IAssetMetadata = {
                asset: {
                    ...testAssets[1],
                    state: AssetState.Visited,
                },
                regions: [MockFactory.createMockRegion()],
            };

            expect(getState(wrapper).selectedAsset).toEqual(expectedAssetMetadtata);
        });

        it("selects the previous asset when clicking the 'Previous Asset' button in the toolbar", async () => {
            await MockFactory.flushUi(() => wrapper.find(NextAsset).simulate("click")); // Move to Asset 2
            await MockFactory.flushUi(() => wrapper.find(NextAsset).simulate("click")); // Move to Asset 3
            await MockFactory.flushUi(() => wrapper.find(PreviousAsset).simulate("click")); // Move to Asset 2

            wrapper.update();

            const expectedAssetMetadtata: IAssetMetadata = {
                asset: {
                    ...testAssets[1],
                    state: AssetState.Visited,
                },
                regions: [MockFactory.createMockRegion()],
            };

            expect(getState(wrapper).selectedAsset).toEqual(expectedAssetMetadtata);
        });
    });

    describe("Basic tag interaction tests", () => {
        it("tags are initialized correctly", () => {
            const project = MockFactory.createTestProject();
            const store = createReduxStore({
                ...MockFactory.initialState(),
                currentProject: project,
            });
            const wrapper = createComponent(store, MockFactory.editorPageProps());
            expect(getState(wrapper).project.tags).toEqual(project.tags);
        });

        it("create a new tag from text box", () => {
            const project = MockFactory.createTestProject();
            const store = createReduxStore({
                ...MockFactory.initialState(),
                currentProject: project,
            });
            const wrapper = createComponent(store, MockFactory.editorPageProps());
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

            const wrapper = createComponent(store, MockFactory.editorPageProps());
            expect(getState(wrapper).project.tags).toEqual(project.tags);
            wrapper.find("a.ReactTags__remove")
                .last().simulate("click");

            const stateTags = getState(wrapper).project.tags;
            expect(stateTags).toHaveLength(project.tags.length - 1);
        });

        it("calls onTagClick handler when hot key is pressed", () => {
            const testProject = MockFactory.createTestProject("TestProject");
            const testAssets = MockFactory.createTestAssets(5);
            const store = createStore(testProject, true);
            const props = MockFactory.editorPageProps(testProject.id);

            AssetProviderFactory.create = jest.fn(() => {
                return {
                    getAssets: jest.fn(() => Promise.resolve(testAssets)),
                };
            });

            const wrapper = createComponent(store, props);
            const editorPage = wrapper.find(EditorPage).childAt(0);

            const spy = jest.spyOn(editorPage.instance() as EditorPage, "onTagClicked");

            const keyPressed = 2;
            setImmediate(() => {
                (editorPage.instance() as EditorPage)
                    .handleTagHotKey({ ctrlKey: true, key: keyPressed.toString() } as KeyboardEvent);
                expect(spy).toBeCalledWith({ name: testProject.tags[keyPressed - 1].name });
            });
        });
    });
});

function createStore(project: IProject, setCurrentProject: boolean = false): Store<any, AnyAction> {
    const initialState: IApplicationState = {
        currentProject: setCurrentProject ? project : null,
        appSettings: MockFactory.appSettings(),
        connections: [],
        recentProjects: [project],
    };

    return createReduxStore(initialState);
}
