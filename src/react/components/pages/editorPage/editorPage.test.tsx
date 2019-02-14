import React from "react";
import { mount, ReactWrapper } from "enzyme";
import _ from "lodash";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import { AnyAction, Store } from "redux";
import EditorPage, { IEditorPageProps, IEditorPageState } from "./editorPage";
import MockFactory from "../../../../common/mockFactory";
import {
    IApplicationState, IAssetMetadata, IProject,
    EditorMode, IAsset, AssetState,
} from "../../../../models/applicationState";
import { AssetProviderFactory } from "../../../../providers/storage/assetProviderFactory";
import createReduxStore from "../../../../redux/store/store";
import { AssetService } from "../../../../services/assetService";
import registerToolbar from "../../../../registerToolbar";
import { DrawPolygon } from "../../toolbar/drawPolygon";
import { DrawRectangle } from "../../toolbar/drawRectangle";
import { Select } from "../../toolbar/select";
import { Pan } from "../../toolbar/pan";
import { KeyboardManager } from "../../common/keyboardManager/keyboardManager";
import { NextAsset } from "../../toolbar/nextAsset";
import { PreviousAsset } from "../../toolbar/previousAsset";

jest.mock("../../../../services/projectService");
import ProjectService from "../../../../services/projectService";

jest.mock("vott-ct/lib/js/CanvasTools/CanvasTools.Editor");
import { Editor } from "vott-ct/lib/js/CanvasTools/CanvasTools.Editor";

jest.mock("vott-ct/lib/js/CanvasTools/Region/RegionsManager");
import { RegionsManager } from "vott-ct/lib/js/CanvasTools/Region/RegionsManager";
import EditorFooter from "./editorFooter";
import { AssetPreview } from "../../common/assetPreview/assetPreview";
import Canvas from "./canvas";

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

function getMockAssetMetadata(testAssets: IAsset[], assetIndex = 0): IAssetMetadata {
    const mockRegion = MockFactory.createMockRegion();
    const asset = testAssets[assetIndex];
    const assetMetadata = {
        asset: {
            ...asset,
            state: AssetState.Tagged,
        },
        regions: [
            {
                ...mockRegion,
                tags: [
                    {
                        ...mockRegion.tags[0],
                        color: expect.stringMatching(/^#[0-9a-f]{3,6}$/i),
                    },
                ],
            },
        ],
    };

    return assetMetadata;
}

describe("Editor Page Component", () => {
    let assetServiceMock: jest.Mocked<typeof AssetService> = null;
    let projectServiceMock: jest.Mocked<typeof ProjectService> = null;

    const testAssets: IAsset[] = MockFactory.createTestAssets(5);

    beforeAll(() => {
        const editorMock = Editor as any;
        editorMock.prototype.addContentSource = jest.fn(() => Promise.resolve());
        editorMock.prototype.scaleRegionToSourceSize = jest.fn((regionData: any) => regionData);
        editorMock.prototype.RM = new RegionsManager(null, null);
        editorMock.prototype.AS = { setSelectionMode: jest.fn() };
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

    it("Updates state from props changes if project is null at creation", async () => {
        const testProject = MockFactory.createTestProject("TestProject");
        const store = createStore(testProject, false);
        const props = MockFactory.editorPageProps(testProject.id);

        // Simulate navigation directly via a null project
        props.project = null;

        const wrapper = createComponent(store, props);
        const editorPage = wrapper.find(EditorPage).childAt(0);
        expect(getState(wrapper).project).toBeNull();

        editorPage.props().project = testProject;
        await MockFactory.flushUi();
        expect(editorPage.props().project).toEqual(testProject);
        expect(getState(wrapper).project).toEqual(testProject);
    });

    it("Loads and merges project assets with asset provider assets when state changes", async () => {
        const projectAssets = MockFactory.createTestAssets(10, 10);
        const testProject = MockFactory.createTestProject("TestProject");
        testProject.assets = _.keyBy(projectAssets, (asset) => asset.id);

        const store = createStore(testProject, true);
        const props = MockFactory.editorPageProps(testProject.id);

        const wrapper = createComponent(store, props);
        const editorPage = wrapper.find(EditorPage).childAt(0);

        const partialProject = {
            id: testProject.id,
            name: testProject.name,
        };

        await MockFactory.flushUi();

        const expectedAssetMetadtata: IAssetMetadata = getMockAssetMetadata(projectAssets);

        expect(editorPage.props().project).toEqual(expect.objectContaining(partialProject));
        expect(editorPage.state().assets.length).toEqual(projectAssets.length + testAssets.length);
        expect(editorPage.state().selectedAsset).toMatchObject(expectedAssetMetadtata);
    });

    it("Raises onAssetSelected handler when an asset is selected from the sidebar", async () => {
        // create test project and asset
        const testProject = MockFactory.createTestProject("TestProject");
        const defaultAsset = testAssets[0];

        // mock store and props
        const store = createStore(testProject, true);
        const props = MockFactory.editorPageProps(testProject.id);

        const loadAssetMetadataSpy = jest.spyOn(props.actions, "loadAssetMetadata");
        const saveAssetMetadataSpy = jest.spyOn(props.actions, "saveAssetMetadata");
        const saveProjectSpy = jest.spyOn(props.actions, "saveProject");

        // create mock editor page
        createComponent(store, props);

        const partialProject = {
            id: testProject.id,
            name: testProject.name,
        };

        const expectedAssetMetadtata: IAssetMetadata = getMockAssetMetadata(testAssets);

        await MockFactory.flushUi();

        expect(loadAssetMetadataSpy).toBeCalledWith(expect.objectContaining(partialProject), defaultAsset);
        expect(saveAssetMetadataSpy).toBeCalledWith(
            expect.objectContaining(partialProject),
            expectedAssetMetadtata,
        );
        expect(saveProjectSpy).toBeCalledWith(expect.objectContaining(partialProject));
    });

    describe("Editing Video Assets", () => {
        it("Child assets are not included within editor page state", async () => {
            const testProject = MockFactory.createTestProject("TestProject");
            const videoAsset = MockFactory.createVideoTestAsset("TestVideo");
            const videoFrames = MockFactory.createChildVideoAssets(videoAsset);
            const projectAssets = [videoAsset].concat(videoFrames);
            testProject.assets = _.keyBy(projectAssets, (asset) => asset.id);

            const store = createStore(testProject, true);
            const props = MockFactory.editorPageProps(testProject.id);

            const wrapper = createComponent(store, props);
            const editorPage = wrapper.find(EditorPage).childAt(0) as ReactWrapper<IEditorPageProps, IEditorPageState>;

            await MockFactory.flushUi();

            expect(editorPage.state().assets.length).toEqual(testAssets.length + 1);
            expect(editorPage.state().selectedAsset.asset).toEqual({
                ...videoAsset,
                state: AssetState.Visited,
            });
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
            await waitForSelectedAsset(wrapper);
        });

        it("editor mode is changed correctly", async () => {
            wrapper.find(DrawPolygon).simulate("click");
            expect(getState(wrapper).editorMode).toEqual(EditorMode.Polygon);

            wrapper.find(DrawRectangle).simulate("click");
            expect(getState(wrapper).editorMode).toEqual(EditorMode.Rectangle);

            wrapper.find(Select).simulate("click");
            expect(getState(wrapper).editorMode).toEqual(EditorMode.Select);

            wrapper.find(Pan).simulate("click");
            expect(getState(wrapper).editorMode).toEqual(EditorMode.Select);
        });

        it("selects the next asset when clicking the 'Next Asset' button in the toolbar", async () => {
            await MockFactory.flushUi(() => wrapper.find(NextAsset).simulate("click")); // Move to Asset 2
            wrapper.update();

            const expectedAssetMetadtata: IAssetMetadata = getMockAssetMetadata(testAssets, 1);
            expect(getState(wrapper).selectedAsset).toMatchObject(expectedAssetMetadtata);
        });

        it("selects the previous asset when clicking the 'Previous Asset' button in the toolbar", async () => {
            await MockFactory.flushUi(() => wrapper.find(NextAsset).simulate("click")); // Move to Asset 2
            await MockFactory.flushUi(() => wrapper.find(NextAsset).simulate("click")); // Move to Asset 3
            await MockFactory.flushUi(() => wrapper.find(PreviousAsset).simulate("click")); // Move to Asset 2

            wrapper.update();

            const expectedAssetMetadtata: IAssetMetadata = getMockAssetMetadata(testAssets, 1);
            expect(getState(wrapper).selectedAsset).toMatchObject(expectedAssetMetadtata);
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

        it("calls onTagClick handler when hot key is pressed", async () => {
            const project = MockFactory.createTestProject();
            const store = createReduxStore({
                ...MockFactory.initialState(),
                currentProject: project,
            });

            const wrapper = createComponent(store, MockFactory.editorPageProps());
            await waitForSelectedAsset(wrapper);

            wrapper.update();

            const expectedTag = project.tags[2];
            const editorPage = wrapper
                .find(EditorPage)
                .childAt(0) as ReactWrapper<IEditorPageProps, IEditorPageState, EditorPage>;

            wrapper.find(Canvas).find(AssetPreview).props().onLoaded(expect.any(HTMLImageElement));
            await MockFactory.flushUi();

            expect(editorPage.state().selectedAsset.regions[0].tags.length).toEqual(1);
            wrapper.find(EditorFooter).props().onTagClicked(expectedTag);
            expect(editorPage.state().selectedAsset.regions[0].tags.length).toEqual(2);
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

async function waitForSelectedAsset(wrapper: ReactWrapper) {
    await MockFactory.waitForCondition(() => {
        const editorPage = wrapper
            .find(EditorPage)
            .childAt(0);

        return !!editorPage.state().selectedAsset;
    });
}
