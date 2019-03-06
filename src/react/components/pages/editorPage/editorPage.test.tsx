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
import registerToolbar, { ToolbarItemName } from "../../../../registerToolbar";
import { KeyboardManager, KeyEventType } from "../../common/keyboardManager/keyboardManager";

jest.mock("../../../../services/projectService");
import ProjectService from "../../../../services/projectService";

jest.mock("vott-ct/lib/js/CanvasTools/CanvasTools.Editor");
import { Editor } from "vott-ct/lib/js/CanvasTools/CanvasTools.Editor";

jest.mock("vott-ct/lib/js/CanvasTools/Region/RegionsManager");
import { RegionsManager } from "vott-ct/lib/js/CanvasTools/Region/RegionsManager";
import EditorFooter from "./editorFooter";
import { AssetPreview } from "../../common/assetPreview/assetPreview";
import Canvas from "./canvas";
import { appInfo } from "../../../../common/appInfo";

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

function dispatchKeyEvent(key: string, eventType: KeyEventType = KeyEventType.KeyDown) {
    window.dispatchEvent(new KeyboardEvent(
        eventType, {
            key,
        },
    ));
}

describe("Editor Page Component", () => {
    let assetServiceMock: jest.Mocked<typeof AssetService> = null;
    let projectServiceMock: jest.Mocked<typeof ProjectService> = null;

    const testAssets: IAsset[] = MockFactory.createTestAssets(5);

    beforeAll(() => {
        const editorMock = Editor as any;
        editorMock.prototype.addContentSource = jest.fn(() => Promise.resolve());
        editorMock.prototype.scaleRegionToSourceSize = jest.fn((regionData: any) => regionData);
        editorMock.prototype.RM = {
            ...new RegionsManager(null, null),
            getSelectedRegionsBounds: jest.fn(() => MockFactory.createTestRegions()),
        };
        editorMock.prototype.AS = {setSelectionMode: jest.fn()};
    });

    beforeEach(() => {
        assetServiceMock = AssetService as jest.Mocked<typeof AssetService>;
        assetServiceMock.prototype.getAssetMetadata = jest.fn((asset) => {
            const assetMetadata: IAssetMetadata = {
                asset: { ...asset },
                regions: [MockFactory.createTestRegion()],
                version: appInfo.version,
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
        const editorPage = wrapper.find(EditorPage).childAt(0) as ReactWrapper<IEditorPageProps, IEditorPageState>;

        const partialProject = {
            id: testProject.id,
            name: testProject.name,
        };

        await MockFactory.flushUi();

        const expectedAsset = editorPage.state().assets[0];

        expect(editorPage.props().project).toEqual(expect.objectContaining(partialProject));
        expect(editorPage.state().assets.length).toEqual(projectAssets.length + testAssets.length);
        expect(editorPage.state().selectedAsset).toMatchObject({
            asset: {
                ...expectedAsset,
                state: AssetState.Tagged,
            },
        });
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
        const wrapper = createComponent(store, props);
        const editorPage = wrapper.find(EditorPage).childAt(0) as ReactWrapper<IEditorPageProps, IEditorPageState>;

        await MockFactory.flushUi();

        const expectedAsset = editorPage.state().assets[0];
        const partialProject = {
            id: testProject.id,
            name: testProject.name,
        };

        expect(loadAssetMetadataSpy).toBeCalledWith(expect.objectContaining(partialProject), defaultAsset);
        expect(saveAssetMetadataSpy).toBeCalledWith(
            expect.objectContaining(partialProject),
            expect.objectContaining({
                asset: {
                    ...expectedAsset,
                    state: AssetState.Tagged,
                },
            }),
        );
        expect(saveProjectSpy).toBeCalledWith(expect.objectContaining(partialProject));
    });

    it("Check correct saving and loading of last visited asset", async () => {
        // create test project and asset
        const testProject = MockFactory.createTestProject("TestProject");
        testProject.lastVisitedAssetId = testAssets[1].id;
        const defaultAsset = testAssets[1];

        // mock store and props
        const store = createStore(testProject, true);
        const props = MockFactory.editorPageProps(testProject.id);

        const loadAssetMetadataSpy = jest.spyOn(props.actions, "loadAssetMetadata");
        const saveAssetMetadataSpy = jest.spyOn(props.actions, "saveAssetMetadata");
        const saveProjectSpy = jest.spyOn(props.actions, "saveProject");

        // create mock editor page
        const wrapper = createComponent(store, props);
        const editorPage = wrapper.find(EditorPage).childAt(0) as ReactWrapper<IEditorPageProps, IEditorPageState>;

        await MockFactory.flushUi();

        const expectedAsset = editorPage.state().assets[1];
        const partialProject = {
            id: testProject.id,
            name: testProject.name,
            lastVisitedAssetId: testAssets[1].id,
        };

        expect(loadAssetMetadataSpy).toBeCalledWith(expect.objectContaining(partialProject), defaultAsset);
        expect(saveAssetMetadataSpy).toBeCalledWith(
            expect.objectContaining(partialProject),
            expect.objectContaining({
                asset: {
                    ...expectedAsset,
                    state: AssetState.Tagged,
                },
            }),
        );
        expect(saveProjectSpy).toBeCalledWith(expect.objectContaining(partialProject));
    });

    describe("Editor Page Component Forcing Tag Scenario", () => {
        it("Detect new Tag from asset metadata when selecting the Asset", async () => {
            const getAssetMetadataMock = assetServiceMock.prototype.getAssetMetadata as jest.Mock;
            getAssetMetadataMock.mockImplementationOnce((asset) => {
                const assetMetadata: IAssetMetadata = {
                    asset: { ...asset },
                    regions: [{ ...MockFactory.createTestRegion(), tags: ["NEWTAG"] }],
                    version: appInfo.version,
                };
                return Promise.resolve(assetMetadata);
            });

            // create test project and asset
            const testProject = MockFactory.createTestProject("TestProject");

            // mock store and props
            const store = createStore(testProject, true);
            const props = MockFactory.editorPageProps(testProject.id);

            const saveProjectSpy = jest.spyOn(props.actions, "saveProject");

            // create mock editor page
            createComponent(store, props);

            const partialProjectToBeSaved = {
                id: testProject.id,
                name: testProject.name,
                tags: expect.arrayContaining([{
                    name: "NEWTAG",
                    color: "#808000",
                }]),
            };

            await MockFactory.flushUi();

            expect(saveProjectSpy).toBeCalledWith(expect.objectContaining(partialProjectToBeSaved));
        });
    });

    it("When an image is updated the asset metadata is updated", async () => {
        const testProject = MockFactory.createTestProject("TestProject");
        const store = createStore(testProject, true);
        const props = MockFactory.editorPageProps(testProject.id);
        const wrapper = createComponent(store, props);
        const imageAsset = testAssets[0];

        await MockFactory.flushUi();
        wrapper.update();

        const editedImageAsset: IAssetMetadata = {
            asset: imageAsset,
            regions: [MockFactory.createTestRegion()],
            version: appInfo.version,
        };

        const saveMock = assetServiceMock.prototype.save as jest.Mock;
        saveMock.mockClear();

        wrapper.find(Canvas).props().onAssetMetadataChanged(editedImageAsset);
        await MockFactory.flushUi();

        const editorPage = wrapper.find(EditorPage).childAt(0) as ReactWrapper<IEditorPageProps, IEditorPageState>;

        // Image asset is updated
        expect(assetServiceMock.prototype.save).toBeCalledWith({
            asset: {
                ...imageAsset,
                state: AssetState.Tagged,
            },
            regions: editedImageAsset.regions,
            version: appInfo.version,
        });

        const matchingRootAsset = editorPage.state().assets.find((asset) => asset.id === imageAsset.id);
        expect(matchingRootAsset.state).toEqual(AssetState.Tagged);
    });

    describe("Editing Video Assets", () => {
        let wrapper: ReactWrapper;
        let videoAsset: IAsset;
        let videoFrames: IAsset[];

        beforeEach(async () => {
            const testProject = MockFactory.createTestProject("TestProject");
            videoAsset = MockFactory.createVideoTestAsset("TestVideo");
            videoFrames = MockFactory.createChildVideoAssets(videoAsset);
            const projectAssets = [videoAsset].concat(videoFrames);
            testProject.assets = _.keyBy(projectAssets, (asset) => asset.id);

            const store = createStore(testProject, true);
            const props = MockFactory.editorPageProps(testProject.id);

            wrapper = createComponent(store, props);

            await MockFactory.flushUi();
            wrapper.update();
        });

        it("Child assets are not included within editor page state", () => {
            const editorPage = wrapper.find(EditorPage).childAt(0) as ReactWrapper<IEditorPageProps, IEditorPageState>;

            expect(editorPage.state().assets.length).toEqual(testAssets.length + 1);
            expect(editorPage.state().selectedAsset.asset).toEqual({
                ...videoAsset,
                state: AssetState.Visited,
            });
        });

        it("When a VideoFrame is updated the root asset is also updated", async () => {
            const getAssetMetadataMock = assetServiceMock.prototype.getAssetMetadata as jest.Mock;
            getAssetMetadataMock.mockImplementationOnce(() => Promise.resolve({
                asset: { ...videoAsset },
                regions: [],
            }));

            const editedVideoFrame: IAssetMetadata = {
                asset: videoFrames[0],
                regions: [MockFactory.createTestRegion()],
                version: appInfo.version,
            };

            const saveMock = assetServiceMock.prototype.save as jest.Mock;
            saveMock.mockClear();

            wrapper.find(Canvas).props().onAssetMetadataChanged(editedVideoFrame);
            await MockFactory.flushUi();

            const editorPage = wrapper.find(EditorPage).childAt(0) as ReactWrapper<IEditorPageProps, IEditorPageState>;

            const expectedRootVideoMetadata: IAssetMetadata = {
                asset: {
                    ...videoAsset,
                    state: AssetState.Tagged,
                },
                regions: [],
                version: appInfo.version,
            };

            // Called 2 times, once for root and once for child.
            expect(saveMock).toBeCalledTimes(2);

            // Root asset is updated
            expect(saveMock.mock.calls[0][0]).toEqual(expectedRootVideoMetadata);

            // Child asset is updated
            expect(saveMock.mock.calls[1][0]).toEqual(editedVideoFrame);

            const matchingRootAsset = editorPage.state().assets.find((asset) => asset.id === videoAsset.id);
            expect(matchingRootAsset.state).toEqual(AssetState.Tagged);
        });
    });
    describe("Basic toolbar test and hotkey tests", () => {
        let wrapper: ReactWrapper = null;
        let editorPage: ReactWrapper<IEditorPageProps, IEditorPageState> = null;

        const copiedRegion = MockFactory.createTestRegion("copiedRegion");

        const copyRegions = jest.fn();
        const cutRegions = jest.fn();
        const pasteRegions = jest.fn();
        const clearRegions = jest.fn();

        beforeAll(() => {
            registerToolbar();
            const clipboard = (navigator as any).clipboard;
            if (!(clipboard && clipboard.writeText)) {
                (navigator as any).clipboard = {
                    writeText: jest.fn(() => Promise.resolve()),
                    readText: jest.fn(() => Promise.resolve(JSON.stringify([copiedRegion]))),
                };
            }
        });

        beforeEach(async () => {
            const testProject = MockFactory.createTestProject("TestProject");
            const store = createStore(testProject, true);
            const props = MockFactory.editorPageProps(testProject.id);
            wrapper = createComponent(store, props);

            editorPage = wrapper.find(EditorPage).childAt(0);
            await waitForSelectedAsset(wrapper);
            wrapper.update();
            const canvas = wrapper.find(Canvas).instance() as Canvas;
            canvas.copyRegions = copyRegions;
            canvas.cutRegions = cutRegions;
            canvas.pasteRegions = pasteRegions;
            canvas.clearRegions = clearRegions;
        });

        it("editor mode is changed correctly", async () => {
            wrapper.find(`.${ToolbarItemName.DrawPolygon}`).simulate("click");
            expect(getState(wrapper).editorMode).toEqual(EditorMode.Polygon);

            wrapper.find(`.${ToolbarItemName.DrawRectangle}`).simulate("click");
            expect(getState(wrapper).editorMode).toEqual(EditorMode.Rectangle);

            wrapper.find(`.${ToolbarItemName.SelectCanvas}`).simulate("click");
            expect(getState(wrapper).editorMode).toEqual(EditorMode.Select);
        });

        it("selects the next asset when clicking the 'Next Asset' button in the toolbar", async () => {
            await MockFactory.flushUi(() => wrapper
                .find(`.${ToolbarItemName.NextAsset}`).simulate("click")); // Move to Asset 2
            wrapper.update();

            const expectedAsset = editorPage.state().assets[1];
            expect(getState(wrapper).selectedAsset).toMatchObject({ asset: expectedAsset });
        });

        it("selects the previous asset when clicking the 'Previous Asset' button in the toolbar", async () => {
            await MockFactory.flushUi(() => wrapper
                .find(`.${ToolbarItemName.NextAsset}`).simulate("click")); // Move to Asset 2
            await MockFactory.flushUi(() => wrapper
                .find(`.${ToolbarItemName.NextAsset}`).simulate("click")); // Move to Asset 3
            await MockFactory.flushUi(() => wrapper
                .find(`.${ToolbarItemName.PreviousAsset}`).simulate("click")); // Move to Asset 2

            wrapper.update();

            const expectedAsset = editorPage.state().assets[1];
            expect(getState(wrapper).selectedAsset).toMatchObject({ asset: expectedAsset });
        });

        it("Calls copy regions with button click", async () => {
            await MockFactory.flushUi(() => wrapper
                .find(`.${ToolbarItemName.CopyRegions}`).simulate("click"));
            expect(copyRegions).toBeCalled();
        });

        it("Calls cut regions with button click", async () => {
            await MockFactory.flushUi(() => wrapper
                .find(`.${ToolbarItemName.CutRegions}`).simulate("click"));
            expect(cutRegions).toBeCalled();
        });

        it("Calls paste regions with button click", async () => {
            await MockFactory.flushUi(() => wrapper
                .find(`.${ToolbarItemName.PasteRegions}`).simulate("click"));
            expect(pasteRegions).toBeCalled();
        });

        it("Calls clear regions with button click", async () => {
            await MockFactory.flushUi(() => wrapper
                .find(`.${ToolbarItemName.ClearRegions}`).simulate("click"));
            expect(clearRegions).toBeCalled();
        });

        it("Calls copy regions with hot key", async () => {
            dispatchKeyEvent("Ctrl+c");
            expect(copyRegions).toBeCalled();
        });

        it("Calls cut regions with hot key", async () => {
            dispatchKeyEvent("Ctrl+x");
            expect(cutRegions).toBeCalled();
        });

        it("Calls paste regions with hot key", async () => {
            dispatchKeyEvent("Ctrl+v");
            expect(pasteRegions).toBeCalled();
        });

        it("sets selected tag and locked tags when hot key is pressed", async () => {
            const project = MockFactory.createTestProject();
            const store = createReduxStore({
                ...MockFactory.initialState(),
                currentProject: project,
            });

            const wrapper = createComponent(store, MockFactory.editorPageProps());
            await waitForSelectedAsset(wrapper);

            wrapper.update();

            const editorPage = wrapper.find(EditorPage).childAt(0);

            dispatchKeyEvent("1");

            expect(editorPage.state().lockedTags).toEqual([]);
            expect(editorPage.state().selectedTag).toEqual(project.tags[0].name);

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

        it("Adds tag to locked tags when ctrl clicked", async () => {
            const project = MockFactory.createTestProject();
            const store = createReduxStore({
                ...MockFactory.initialState(),
                currentProject: project,
            });

            const wrapper = createComponent(store, MockFactory.editorPageProps());
            await waitForSelectedAsset(wrapper);

            wrapper.update();
            wrapper.find("div.tag")
                .first()
                .simulate("click", { target: { innerText: project.tags[0].name }, ctrlKey: true });
            const newEditorPage = wrapper.find(EditorPage).childAt(0);
            expect(newEditorPage.state().lockedTags).toEqual([project.tags[0].name]);
        });

        it("Removes tag from locked tags when ctrl clicked", async () => {
            const project = MockFactory.createTestProject();
            const store = createReduxStore({
                ...MockFactory.initialState(),
                currentProject: project,
            });

            const wrapper = createComponent(store, MockFactory.editorPageProps());
            await waitForSelectedAsset(wrapper);

            wrapper.update();
            wrapper.find("div.tag")
                .first()
                .simulate("click", { target: { innerText: project.tags[0].name }, ctrlKey: true });
            let editorPage = wrapper.find(EditorPage).childAt(0);
            expect(editorPage.state().lockedTags).toEqual([project.tags[0].name]);

            wrapper.update();
            wrapper.find("div.tag")
                .first()
                .simulate("click", { target: { innerText: project.tags[0].name }, ctrlKey: true });
            editorPage = wrapper.find(EditorPage).childAt(0);
            expect(editorPage.state().lockedTags).toEqual([]);
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
