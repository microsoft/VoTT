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
    EditorMode, IAsset, AssetState, AssetType, ISize,
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
import Canvas from "./canvas";
import { appInfo } from "../../../../common/appInfo";
import SplitPane from "react-split-pane";
import EditorSideBar from "./editorSideBar";
import Alert from "../../common/alert/alert";
import { ObjectDetection } from "../../../../providers/activeLearning/objectDetection";

function createComponent(store, props: IEditorPageProps): ReactWrapper<IEditorPageProps, IEditorPageState, EditorPage> {
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

    const electronMock = {
        remote: {
            app: {
                getAppPath: jest.fn(() => ""),
            },
        },
    };

    const testAssets: IAsset[] = MockFactory.createTestAssets(5);

    beforeAll(() => {
        registerToolbar();
        window["require"] = jest.fn(() => electronMock);

        const editorMock = Editor as any;
        editorMock.prototype.addContentSource = jest.fn(() => Promise.resolve());
        editorMock.prototype.scaleRegionToSourceSize = jest.fn((regionData: any) => regionData);
        editorMock.prototype.RM = {
            ...new RegionsManager(null, null),
            getSelectedRegionsBounds: jest.fn(() => MockFactory.createTestRegions()),
        };
        editorMock.prototype.AS = {
            setSelectionMode: jest.fn(),
            enable: jest.fn(),
            disable: jest.fn(),
        };
    });

    beforeEach(() => {
        assetServiceMock = AssetService as jest.Mocked<typeof AssetService>;
        assetServiceMock.prototype.getAssetMetadata = jest.fn((asset) => {
            const assetMetadata: IAssetMetadata = {
                asset: { ...asset },
                regions: [],
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
        expect(editorPage.state().isValid).toBe(true);
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
                state: AssetState.Visited,
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
                    state: AssetState.Visited,
                },
            }),
        );
        expect(saveProjectSpy).toBeCalledWith(expect.objectContaining(partialProject));
    });

    it("sets page state to invalid when edited asset includes un-tagged regions", async () => {
        // create test project and asset
        const testProject = MockFactory.createTestProject("TestProject");
        const defaultAsset = testAssets[0];

        // mock store and props
        const store = createStore(testProject, true);
        const props = MockFactory.editorPageProps(testProject.id);

        const saveAssetMetadataSpy = jest.spyOn(props.actions, "saveAssetMetadata");
        const saveProjectSpy = jest.spyOn(props.actions, "saveProject");

        // create mock editor page
        const wrapper = createComponent(store, props);
        const editorPage = wrapper.find(EditorPage).childAt(0) as ReactWrapper<IEditorPageProps, IEditorPageState>;

        await MockFactory.flushUi();
        wrapper.update();

        // Create a new un-tagged region
        const newRegion = MockFactory.createTestRegion("unTaggedRegion", []);
        const assetMetadata: IAssetMetadata = {
            asset: defaultAsset,
            regions: [newRegion],
            version: appInfo.version,
        };

        saveAssetMetadataSpy.mockClear();
        saveProjectSpy.mockClear();

        // Initial state change of region
        wrapper.find(Canvas).props().onAssetMetadataChanged(assetMetadata);

        expect(editorPage.state().isValid).toBe(false);
        expect(saveAssetMetadataSpy).not.toBeCalled();
        expect(saveProjectSpy).not.toBeCalled();

        // Apply tag to region
        newRegion.tags = ["test"];
        wrapper.find(Canvas).props().onAssetMetadataChanged(assetMetadata);

        await MockFactory.flushUi();

        expect(editorPage.state().isValid).toBe(true);
        expect(saveAssetMetadataSpy).toBeCalled();
        expect(saveProjectSpy).toBeCalled();
    });

    it("displays un-tagged warning when user attempts to switch assets while page is in invalid state", async () => {
        // create test project and asset
        const testProject = MockFactory.createTestProject("TestProject");
        const defaultAsset = testAssets[0];

        // mock store and props
        const store = createStore(testProject, true);
        const props = MockFactory.editorPageProps(testProject.id);

        const saveAssetMetadataSpy = jest.spyOn(props.actions, "saveAssetMetadata");
        const saveProjectSpy = jest.spyOn(props.actions, "saveProject");

        // create mock editor page
        const wrapper = createComponent(store, props);
        const editorPage = wrapper.find(EditorPage).childAt(0) as ReactWrapper<IEditorPageProps, IEditorPageState>;

        await MockFactory.flushUi();
        wrapper.update();

        // Create a new un-tagged region
        const newRegion = MockFactory.createTestRegion("unTaggedRegion", []);
        const assetMetadata: IAssetMetadata = {
            asset: defaultAsset,
            regions: [newRegion],
            version: appInfo.version,
        };

        saveAssetMetadataSpy.mockClear();
        saveProjectSpy.mockClear();

        // Initial state change
        wrapper.find(Canvas).props().onAssetMetadataChanged(assetMetadata);
        // Attempt to navigate to different asset
        wrapper.find(EditorSideBar).props().onAssetSelected(testAssets[1]);

        expect(editorPage.state().isValid).toBe(false);
        expect(editorPage.state().showInvalidRegionWarning).toBe(true);

        // Close the warning
        wrapper.find(Alert).props().onClose();

        expect(editorPage.state().showInvalidRegionWarning).toBe(false);
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
                    state: AssetState.Visited,
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
                    color: expect.any(String),
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
            regions: [MockFactory.createTestRegion("editedImageAsset", ["test"])],
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
                regions: [MockFactory.createTestRegion("region1", ["test"])],
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
        const removeAllRegionsConfirm = jest.fn();

        beforeAll(() => {
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
            canvas.confirmRemoveAllRegions = removeAllRegionsConfirm;
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

        it("Calls remove all regions confirmation with button click", async () => {
            await MockFactory.flushUi(() => wrapper
                .find(`.${ToolbarItemName.RemoveAllRegions}`).simulate("click"));
            expect(removeAllRegionsConfirm).toBeCalled();
        });

        it("Calls copy regions with hot key", () => {
            dispatchKeyEvent("CmdOrCtrl+c");
            expect(copyRegions).toBeCalled();
        });

        it("Calls cut regions with hot key", () => {
            dispatchKeyEvent("CmdOrCtrl+x");
            expect(cutRegions).toBeCalled();
        });

        it("Calls paste regions with hot key", () => {
            dispatchKeyEvent("CmdOrCtrl+v");
            expect(pasteRegions).toBeCalled();
        });

        it("Calls remove all regions confirmation with hot key", () => {
            dispatchKeyEvent("CmdOrCtrl+Delete");
            expect(removeAllRegionsConfirm).toBeCalled();
        });

        it("sets selected tag when hot key is pressed", async () => {
            const project = MockFactory.createTestProject("test", 5);
            const store = createReduxStore({
                ...MockFactory.initialState(),
                currentProject: project,
            });

            const wrapper = createComponent(store, MockFactory.editorPageProps());
            await waitForSelectedAsset(wrapper);

            expect(editorPage.state().selectedTag).toBeNull();

            dispatchKeyEvent("1");

            expect(editorPage.state().selectedTag).toEqual(project.tags[0].name);
        });

        it("sets selected tag and locked tags when CmdOrCtrl + hot key is pressed", async () => {
            const project = MockFactory.createTestProject("test", 5);
            const store = createReduxStore({
                ...MockFactory.initialState(),
                currentProject: project,
            });

            const wrapper = createComponent(store, MockFactory.editorPageProps());
            await waitForSelectedAsset(wrapper);

            expect(editorPage.state().selectedTag).toBeNull();

            dispatchKeyEvent("CmdOrCtrl+1");

            const firstTag = project.tags[0].name;
            expect(editorPage.state().selectedTag).toEqual(firstTag);
            expect(editorPage.state().lockedTags).toEqual([firstTag]);
        });

        it("does not set selected tag when invalid hot key is pressed", async () => {
            const tagLength = 5;
            const project = MockFactory.createTestProject("test", tagLength);
            const store = createReduxStore({
                ...MockFactory.initialState(),
                currentProject: project,
            });

            const wrapper = createComponent(store, MockFactory.editorPageProps());
            await waitForSelectedAsset(wrapper);

            expect(editorPage.state().selectedTag).toBeNull();

            dispatchKeyEvent((tagLength + 1).toString());

            expect(editorPage.state().selectedTag).toBeNull();
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
            wrapper.find("div.tag-input-toolbar-item.plus").simulate("click");
            wrapper.find(".tag-input-box").simulate("keydown", { key: "Enter", target: { value: newTagName } });

            const stateTags = getState(wrapper).project.tags;

            expect(stateTags).toHaveLength(project.tags.length + 1);
            expect(stateTags[stateTags.length - 1].name).toEqual(newTagName);
        });

        it("Remove a tag", async () => {
            const project = MockFactory.createTestProject("test", 5);
            const store = createReduxStore({
                ...MockFactory.initialState(),
                currentProject: project,
            });

            const wrapper = createComponent(store, MockFactory.editorPageProps());
            await waitForSelectedAsset(wrapper);

            expect(getState(wrapper).project.tags).toEqual(project.tags);
            wrapper.find(".tag-content").last().simulate("click");
            wrapper.find("i.tag-input-toolbar-icon.fas.fa-trash").simulate("click");

            const stateTags = getState(wrapper).project.tags;
            expect(stateTags).toHaveLength(project.tags.length - 1);
        });

        it("Adds tag to locked tags when CmdOrCtrl clicked", async () => {
            const project = MockFactory.createTestProject();
            const store = createReduxStore({
                ...MockFactory.initialState(),
                currentProject: project,
            });

            const wrapper = createComponent(store, MockFactory.editorPageProps());
            await waitForSelectedAsset(wrapper);

            wrapper.update();
            wrapper.find("span.tag-name-text")
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
            wrapper.find("span.tag-name-text")
                .first()
                .simulate("click", { target: { innerText: project.tags[0].name }, ctrlKey: true });
            let editorPage = wrapper.find(EditorPage).childAt(0);
            expect(editorPage.state().lockedTags).toEqual([project.tags[0].name]);

            wrapper.update();
            wrapper.find("span.tag-name-text")
                .first()
                .simulate("click", { target: { innerText: project.tags[0].name }, ctrlKey: true });
            editorPage = wrapper.find(EditorPage).childAt(0);
            expect(editorPage.state().lockedTags).toEqual([]);
        });
    });

    describe("Resizing editor page", () => {
        let wrapper: ReactWrapper;
        const defaultThumbnailSize: ISize = {
            width: 400,
            height: 300,
        };

        beforeEach(async () => {
            const project = MockFactory.createTestProject();
            const store = createReduxStore({
                ...MockFactory.initialState(),
                currentProject: project,
                appSettings: {
                    ...MockFactory.appSettings(),
                    thumbnailSize: defaultThumbnailSize,
                },
            });

            wrapper = createComponent(store, MockFactory.editorPageProps());
            await waitForSelectedAsset(wrapper);
            wrapper.update();
        });

        it("loads default thumbnail size from app settings", () => {
            const editorPage = wrapper.find(EditorPage).childAt(0);
            expect(editorPage.state().thumbnailSize).toEqual(defaultThumbnailSize);
        });

        it("resizes child components", () => {
            const editorPage = wrapper.find(EditorPage).childAt(0);
            const canvas = editorPage.find(Canvas).instance() as Canvas;
            const resizeSpy = jest.spyOn(canvas, "forceResize");
            const newThumbnailWidth = 300;
            wrapper.find(SplitPane).props().onChange(newThumbnailWidth);

            expect(resizeSpy).toBeCalled();
            expect(editorPage.state().thumbnailSize).toEqual({
                width: newThumbnailWidth,
                height: newThumbnailWidth / (4 / 3),
            });
        });

        it("Saves thumbnail size to app settings", () => {
            const editorPage = wrapper.find(EditorPage).childAt(0) as ReactWrapper<IEditorPageProps>;
            const saveSettingsSpy = jest.spyOn(editorPage.props().applicationActions, "saveAppSettings");
            const newThumbnailWidth = 300;

            wrapper.find(SplitPane).props().onChange(newThumbnailWidth);
            wrapper.find(SplitPane).props().onDragFinished(newThumbnailWidth);

            expect(saveSettingsSpy).toBeCalledWith(expect.objectContaining({
                thumbnailSize: {
                    width: newThumbnailWidth,
                    height: newThumbnailWidth / (4 / 3),
                },
            }));
        });
    });

    describe("Active Learning", () => {
        let wrapper: ReactWrapper = null;
        let editorPage: ReactWrapper<IEditorPageProps, IEditorPageState> = null;

        const objectDetectionMock = ObjectDetection as jest.Mock<ObjectDetection>;
        Object.defineProperty(objectDetectionMock.prototype, "loaded", {
            get: () => {
              return true;
            },
        });
        objectDetectionMock.prototype.detect = jest.fn(() => {
            return [{bbox: [227, 227, 0, 0], class: "label", score: 1}];
        });

        const assetTestCache = new Map<string, IAsset>();
        beforeEach(async () => {
            const testProject = MockFactory.createTestProject("TestProject");
            const store = createStore(testProject, true);
            const props = MockFactory.editorPageProps(testProject.id);
            wrapper = createComponent(store, props);

            editorPage = wrapper.find(EditorPage).childAt(0);
            await waitForSelectedAsset(wrapper);
            wrapper.update();

            assetTestCache.clear();

            document.createElement = jest.fn((elementType) => {
                switch (elementType) {
                    case "img":
                        return mockImage();
                    case "video":
                        return mockVideo();
                    case "canvas":
                        return mockCanvas();
                }
            });

            document.querySelector = jest.fn((selectors) => {
                return mockCanvas();
            });
        });

        it("Detect regions and tags", async () => {
            wrapper.find(`.${ToolbarItemName.ActiveLearning}`).simulate("click");
            await waitForPrediction(wrapper);

            // expect(true).toEqual(false);
        });

        const mockImage = jest.fn(() => {
            const element: any = {
                naturalWidth: 0,
                naturalHeight: 0,
                onload: jest.fn(),
            };

            setImmediate(() => {
                const asset = assetTestCache.get(element.src);
                if (asset) {
                    element.naturalWidth = asset.size.width;
                    element.naturalHeight = asset.size.height;
                }

                element.onload();
            });

            return element;
        });

        const mockVideo = jest.fn(() => {
            const element: any = {
                src: "",
                duration: 0,
                currentTime: 0,
                videoWidth: 0,
                videoHeight: 0,
                onloadedmetadata: jest.fn(),
                onseeked: jest.fn(),
                onerror: jest.fn(),
            };

            setImmediate(() => {
                const asset = assetTestCache.get(element.src);
                if (asset.name.toLowerCase().indexOf("error") > -1) {
                    element.onerror("An error occurred loading the video");
                } else {
                    element.videoWidth = asset.size.width;
                    element.videoHeight = asset.size.height;
                    element.currentTime = asset.timestamp;
                    element.onloadedmetadata();
                    element.onseeked();
                }
            });

            return element;
        });

        const mockCanvas = jest.fn(() => {
            const canvas: any = {
                width: 0,
                height: 0,
                getContext: jest.fn(() => {
                    return {
                        drawImage: jest.fn(),
                    };
                }),
                toBlob: jest.fn((callback) => {
                    callback(new Blob(["Binary image data"]));
                }),
            };

            return canvas;
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

async function waitForPrediction(wrapper: ReactWrapper) {
    await MockFactory.waitForCondition(() => {
        const editorPage = wrapper
            .find(EditorPage)
            .childAt(0);

        return editorPage.state().selectedAsset.asset.predicted === true;
    });
}
