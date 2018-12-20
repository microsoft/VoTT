import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import { mount, ReactWrapper } from "enzyme";
import { Store, AnyAction } from "redux";
import EditorPage, { IEditorPageProps } from "./editorPage";
import { AssetProviderFactory } from "../../../../providers/storage/assetProvider";
import { IApplicationState, IProject} from "../../../../models/applicationState";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import { AssetService } from "../../../../services/assetService";
import createReduxStore from "../../../../redux/store/store";
import MockFactory from "../../../../common/mockFactory";

jest.mock("../../../../services/projectService");
import ProjectService from "../../../../services/projectService";
import EditorSideBar from "./editorSideBar";

describe("Editor Page Component", () => {
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
        projectServiceMock = ProjectService as jest.Mocked<typeof ProjectService>;
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
        const testProject = MockFactory.createTestProject("TestProject");
        const store = createStore(testProject, true);
        const props = createProps(testProject.id);

        const wrapper = createCompoent(store, props);
        const editorPage = wrapper.find(EditorPage).childAt(0);

        wrapper.setProps({
            project: testProject,
        });

        setImmediate(() => {
            expect(editorPage.prop("project")).toEqual(testProject);
            expect(editorPage.state("assets")).toEqual([]);
        });
    });

    fit("Raises onAssetSelected handler when an asset is selected from the sidebar", async () => {
        AssetProviderFactory.register("testProvider", () => MockFactory.createAssetProvider());
        const testProject = MockFactory.createTestProject("TestProject");

        const store = createStore(testProject, true);
        const props = createProps(testProject.id);

        const wrapper = createCompoent(store, props);
        const editorPage = wrapper.find(EditorPage).childAt(0);

        const editorSideBar = wrapper.find(EditorSideBar);
        const onAssetSelectedSpy = jest.spyOn(editorSideBar.props(), "onAssetSelected");

        // THOUGHT PROCESS: probs have to create jest.fn() => something for onAssetSelected
        // then have to mock selecting an item and check if this mock fn is called

        // mock an selecting an item from the sidebar

        setImmediate(() => {
            // check to see if editorPage's editorSideBar.props onAssetSelected is called
            expect(editorPage.find(EditorSideBar)).not.toBeNull();
            expect(onAssetSelectedSpy).toBeCalled();
            // expect(editorPage.find(EditorSideBar).prop("onAssetSelected")).toBeCalled();
        });

    //     const asset = MockFactory.createTestAsset("TestAsset");
    //     const assetMetadata = MockFactory.createTestAssetMetadata(asset);
    //     const mockAssetService = AssetService as jest.Mocked<typeof AssetService>;
    //     mockAssetService.prototype.getAssetMetadatas = jest.fn(() => assetMetadata);

    //     const result = await projectActions.loadAssetMetadata(testProject, asset)(store.dispatch);

    //     expect(mockAssetService.prototype.getAssetMetadata).toBeCalledWith(asset);
    //     expect(result).toEqual(assetMetadata);
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
