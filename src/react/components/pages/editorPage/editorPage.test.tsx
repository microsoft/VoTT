import React from "react";
import { Provider } from "react-redux";
import createReduxStore from "../../../../redux/store/store";
import initialState from "../../../../redux/store/initialState";
import EditorPage from "./editorPage";
import { BrowserRouter as Router } from "react-router-dom";
import { mount } from "enzyme";
import { IApplicationState,
         IProject,
         IAsset,
         ITag,
         IConnection,
         IExportFormat,
         AssetState,
         IAssetMetadata} from "../../../../models/applicationState";
import IProjectActions from "../../../../redux/actions/projectActions";
import AssetPreview from "./assetPreview";

describe("Editor Page Component", () => {
    const defaultState: IApplicationState = initialState;
    const store = createReduxStore(defaultState);
    let wrapper: any;
    let connection: IConnection;
    let format: IExportFormat;
    let testProject: IProject = null;
    let assets: IAsset[];
    const recentProjects: IProject[] = null;
    const assetState: AssetState = null;
    let state: any;
    let projectActions: IProjectActions;
    let testAsset: IAsset;
    const executor = () => { return; };
    const history: any = null;
    const location: any = null;
    let match: any;
    let onChangeHandler: (value: any) => void;

    beforeEach(() => {
        connection = {
            id: "1",
            name: "connection",
            description: "test connection",
            providerType: "provider",
            providerOptions: {},
        };
        format = {
            providerType: "provider",
            providerOptions: {},
        };
        testProject = {
            id: "1",
            name: "project1",
            description: "test project",
            tags: [],
            sourceConnectionId: "123",
            sourceConnection: connection,
            targetConnectionId: "456",
            targetConnection: connection,
            exportFormat: format,
            autoSave: true,
            assets: { testAsset },
        };
        projectActions = {
            // loadProjects: (project: IProject) => new Promise<IProject[]>(executor),
            loadProject: (project: IProject) => new Promise<IProject>(executor),
            saveProject: (project: IProject) => new Promise<IProject>(executor),
            deleteProject: (project: IProject) => new Promise<void>(executor),
            closeProject: () => { return; },
            exportProject: (project: IProject) => new Promise<void>(executor),
            // loadAssets: (project: IProject) => Promise<IAsset>,
            loadAssetMetadata: (project: IProject, asset: IAsset) => new Promise<IAssetMetadata>(executor),
            // saveAssetMetadata(project: IProject, assetMetadata: IAssetMetadata): Promise<IAssetMetadata>,
        };
        testAsset = {
            id: "1",
            type: 0,
            state: 0,
            name: "asset",
            path: "path",
            size: {
                width: 1,
                height: 1,
            },
        };
        assets = [testAsset];
        state = {
            testProject,
            assets,
        };
        match = {
            params: {
                projectId: 1,
            },
            isExact: true,
            path: "",
            url: "",
        };

        onChangeHandler = jest.fn();

        wrapper = mount(
            <Provider store={store}>
                <Router>
                    <EditorPage
                        project={testProject}
                        projectActions={projectActions}
                        history={history}
                        location={location}
                        match={match}
                        recentProjects={recentProjects}
                    />
                </Router>
            </Provider>,
        );
    });

    it("renders an AssetPreview object", () => {
        expect(wrapper.exists());
        expect(wrapper.find("asset-list")).toBeTruthy();
    });

    // after you simulate the click you want to validate the state of the component
    // and  ensure that selectedAsset has been correctly set on the state.
    it("should call selectAsset when asset item is clicked", () => {
        // const preview = wrapper.find("div.asset-item-image").find(AssetPreview);
        const assetItem = wrapper.find("div.asset-list").at(0);
        assetItem.simulate("click");
        wrapper.setState({assets: testAsset, project: testProject});
        wrapper.update();
        expect((wrapper.state()).not.toBeNull());
        // expect((wrapper.state("assets").at(0)).toEqual(testAsset));
        // expect(wrapper.find("div.asset-item")).toBeTruthy();
        // const spy = jest.spyOn(EditorPage.prototype, "selectAsset");
        // expect(spy).toBeCalled();
    });

});
