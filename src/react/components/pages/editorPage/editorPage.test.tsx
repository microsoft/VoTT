import React from "react";
import { Provider } from "react-redux";
import createReduxStore from "../../../../redux/store/store";
import initialState from "../../../../redux/store/initialState";
import EditorPage, { IEditorPageProps } from "./editorPage";
import { Store, AnyAction } from "redux";
import { BrowserRouter as Router } from "react-router-dom";
import { mount, ReactWrapper } from "enzyme";
import { IApplicationState,
         IProject,
         IAsset,
         ITag,
         IConnection,
         IExportFormat,
         AssetState,
         IAssetMetadata} from "../../../../models/applicationState";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
// import IProjectActions from "../../../../redux/actions/projectActions";
import AssetPreview from "./assetPreview";
import MockFactory from "../../../../common/mockFactory";

jest.mock("../../../../services/projectService");
import ProjectService from "../../../../services/projectService";

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
        const exportPage = wrapper.find(EditorPage).childAt(0);

        expect(loadProjectSpy).not.toBeCalled();
        expect(exportPage.prop("project")).toEqual(testProject);
    });

    // it("Sets project state from route params", (done) => {
    //     const testProject = MockFactory.createTestProject("TestProject");
    //     const store = createStore(testProject, false);
    //     const props = createProps(testProject.id);
    //     const loadProjectSpy = jest.spyOn(props.actions, "loadProject");

    //     const wrapper = createCompoent(store, props);
    //     const exportPage = wrapper.find(EditorPage).childAt(0);

    //     setImmediate(() => {
    //         expect(loadProjectSpy).toHaveBeenCalledWith(testProject);
    //         expect(exportPage.prop("project")).toEqual(testProject);
    //         done();
    //     });
    // });

    // it("Calls save and export project actions on form submit", (done) => {
    //     const testProject = MockFactory.createTestProject("TestProject");
    //     const store = createStore(testProject, true);
    //     const props = createProps(testProject.id);

    //     const saveProjectSpy = jest.spyOn(props.actions, "saveProject");
    //     const exportProjectSpy = jest.spyOn(props.actions, "exportProject");

    //     // ExportProviderFactory.create = jest.fn(() => {
    //     //     return {
    //     //         export: jest.fn(() => Promise.resolve()),
    //     //     };
    //     });

        // projectServiceMock.prototype.save = jest.fn((project) => Promise.resolve(project));

    //     const wrapper = createCompoent(store, props);
    //     wrapper.find("form").simulate("submit");
    //     wrapper.update();

    //     setImmediate(() => {
    //         expect(saveProjectSpy).toBeCalled();
    //         expect(exportProjectSpy).toBeCalled();
    //         expect(props.history.goBack).toBeCalled();

    //         const state = store.getState() as IApplicationState;
    //         expect(state.currentProject.exportFormat).not.toBeNull();
    //         done();
    //     });
    // });
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
    // const defaultState: IApplicationState = initialState;
    // const store = createReduxStore(initialState);
    // let wrapper: any;
    // let connection: IConnection;
    // let format: IExportFormat;
    // let testProject: IProject = null;
    // let assets: IAsset[];
    // let recentProjects: IProject[];
    // const assetState: AssetState = null;
    // let state: any;
    // let projectActions: IProjectActions;
    // let testAsset: IAsset;
    // const executor = () => { return; };
    // const history: any = null;
    // const location: any = null;
    // let match: any;
    // let onChangeHandler: (value: any) => void;

//         connection = {
//             id: "1",
//             name: "connection",
//             description: "test connection",
//             providerType: "provider",
//             providerOptions: {},
//         };
//         format = {
//             providerType: "provider",
//             providerOptions: {},
//         };
//         testAsset = {
//             id: "1",
//             type: 0,
//             state: 0,
//             name: "asset",
//             path: "path",
//             size: {
//                 width: 1,
//                 height: 1,
//             },
//         };
//         testProject = {
//             id: "1",
//             name: "project1",
//             description: "test project",
//             tags: [],
//             sourceConnectionId: "123",
//             sourceConnection: connection,
//             targetConnectionId: "456",
//             targetConnection: connection,
//             exportFormat: format,
//             autoSave: true,
//             assets: { testAsset },
//         };
//         projectActions = {
//             // loadProjects: (project: IProject) => new Promise<IProject[]>(executor),
//             loadProject: (project: IProject) => new Promise<IProject>(executor),
//             saveProject: (project: IProject) => new Promise<IProject>(executor),
//             deleteProject: (project: IProject) => new Promise<void>(executor),
//             closeProject: () => { return; },
//             exportProject: (project: IProject) => new Promise<void>(executor),
//             loadAssets: (project: IProject) => new Promise<IAsset[]>(executor),
//             loadAssetMetadata: (project: IProject, asset: IAsset) => new Promise<IAssetMetadata>(executor),
//             saveAssetMetadata: (project: IProject, assetMetadata: IAssetMetadata) =>
//                 new Promise<IAssetMetadata>(executor),
//         };
//         assets = [testAsset];
//         state = {
//             testProject,
//             assets,
//         };
//         match = {
//             params: {
//                 projectId: 1,
//             },
//             isExact: true,
//             path: "",
//             url: "",
//         };
//         recentProjects = [testProject];

//         onChangeHandler = jest.fn();

//         try {
//             wrapper = mount(
//             <Provider store={store}>
//                 <Router>
//                     <EditorPage
//                         project={testProject}
//                         projectActions={projectActions}
//                         history={history}
//                         location={location}
//                         match={match}
//                         recentProjects={recentProjects}
//                     />
//                 </Router>
//             </Provider>,
//             );
//         }
//         catch (e) {
//             console.log(e);
//         }
//     });

//     it("renders an AssetPreview object", () => {
//         expect(wrapper.exists());
//         expect(wrapper.find("asset-list")).toBeTruthy();
//     });

//     // after you simulate the click you want to validate the state of the component
//     // and  ensure that selectedAsset has been correctly set on the state.
//     it("should call selectAsset when asset item is clicked", () => {
//         // const preview = wrapper.find("div.asset-item-image").find(AssetPreview);
//         const assetItem = wrapper.find("div.asset-list").at(0);
//         assetItem.simulate("click");
//         wrapper.setState({assets: testAsset, project: testProject});
//         wrapper.update();
//         expect((wrapper.state()).not.toBeNull());
//         // expect((wrapper.state("assets").at(0)).toEqual(testAsset));
//         // expect(wrapper.find("div.asset-item")).toBeTruthy();
//         // const spy = jest.spyOn(EditorPage.prototype, "selectAsset");
//         // expect(spy).toBeCalled();
//     });

// });

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
