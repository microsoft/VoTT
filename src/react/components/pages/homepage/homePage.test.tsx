import { mount, ReactWrapper } from "enzyme";
import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter as Router, Link } from "react-router-dom";
import { AnyAction, Store } from "redux";
import MockFactory from "../../../../common/mockFactory";
import { IApplicationState, IProject, IAppSettings } from "../../../../models/applicationState";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import IApplicationActions, * as applicationActions from "../../../../redux/actions/applicationActions";
import createReduxStore from "../../../../redux/store/store";
import ProjectService from "../../../../services/projectService";
import CondensedList from "../../common/condensedList/condensedList";
import FilePicker from "../../common/filePicker/filePicker";
import HomePage, { IHomepageProps } from "./homePage";

jest.mock("../../../../services/projectService");

describe("Homepage Component", () => {
    let store: Store<IApplicationState> = null;
    let props: IHomepageProps = null;
    let wrapper: ReactWrapper = null;
    let deleteProjectSpy: jest.SpyInstance = null;
    const recentProjects = MockFactory.createTestProjects(2);

    function createComponent(store, props: IHomepageProps): ReactWrapper {
        return mount(
            <Provider store={store}>
                <Router>
                    <HomePage {...props} />
                </Router>
            </Provider>,
        );
    }

    beforeEach(() => {
        const projectServiceMock = ProjectService as jest.Mocked<typeof ProjectService>;
        projectServiceMock.prototype.load = jest.fn((project) => Promise.resolve(project));
        projectServiceMock.prototype.delete = jest.fn(() => Promise.resolve());

        store = createStore(recentProjects);
        props = createProps();
        deleteProjectSpy = jest.spyOn(props.actions, "deleteProject");

        wrapper = createComponent(store, props);
    });

    it("should render a New Project Link", () => {
        expect(wrapper.find(Link).props().to).toBe("/projects/create");
    });

    it("should call upload when 'Open Project' is clicked", () => {
        const fileUpload = wrapper.find("a.file-upload").first();
        const filePicker = wrapper.find(FilePicker);
        const spy = jest.spyOn(filePicker.instance() as FilePicker, "upload");
        fileUpload.simulate("click");
        expect(spy).toBeCalled();
    });

    it("should render a file picker", () => {
        expect(wrapper).not.toBeNull();
        expect(wrapper.find(FilePicker).exists()).toBeTruthy();
    });

    it("should render a list of recent projects", () => {
        expect(wrapper).not.toBeNull();
        const homePage = wrapper.find(HomePage).childAt(0);
        if (homePage.props().recentProjects && homePage.props().recentProjects.length > 0) {
            expect(wrapper.find(CondensedList).exists()).toBeTruthy();
        }
    });

    it("should delete a project when clicking trash icon", async () => {
        const store = createStore(recentProjects);
        const props = createProps();
        const wrapper = createComponent(store, props);

        expect(wrapper.find(".recent-project-item").length).toEqual(recentProjects.length);
        wrapper.find(".delete-btn").first().simulate("click");

        // Accept the modal delete warning
        wrapper.find(".modal-footer button").first().simulate("click");

        await MockFactory.flushUi();
        wrapper.update();

        const homePage = wrapper.find(HomePage).childAt(0);

        expect(deleteProjectSpy).toBeCalledWith(recentProjects[0]);
        expect(homePage.props().recentProjects.length).toEqual(recentProjects.length - 1);
    });

    it("should call open project action after successful file upload", async () => {
        const openProjectSpy = jest.spyOn(props.actions, "loadProject");

        const testProject = recentProjects[0];
        const testProjectJson = JSON.stringify(testProject);
        const testBlob = new Blob([testProjectJson], { type: "application/json" });

        const wrapper = createComponent(store, props);

        const fileUpload = wrapper.find("a.file-upload").first();
        const fileInput = wrapper.find(`input[type="file"]`);
        const filePicker = wrapper.find(FilePicker);
        const uploadSpy = jest.spyOn(filePicker.instance() as FilePicker, "upload");

        fileUpload.simulate("click");
        await MockFactory.flushUi(() => {
            fileInput.simulate("change", ({ target: { files: [testBlob] } }));
        });

        await MockFactory.flushUi();

        expect(uploadSpy).toBeCalled();
        expect(openProjectSpy).toBeCalledWith(testProject);
    });

    function createProps(): IHomepageProps {
        return {
            recentProjects: [],
            project: MockFactory.createTestProject(),
            connections: MockFactory.createTestConnections(),
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
            applicationActions: (applicationActions as any) as IApplicationActions,
            appSettings: {
                devToolsEnabled: false,
                securityTokens: [],
            },
            match: {
                params: {},
                isExact: true,
                path: `https://localhost:3000/`,
                url: `https://localhost:3000/`,
            },
        };
    }

    function createStore(recentProjects: IProject[]): Store<IApplicationState, AnyAction> {
        const initialState: IApplicationState = {
            currentProject: null,
            appSettings: MockFactory.appSettings(),
            connections: [],
            recentProjects,
            appError: null,
        };

        return createReduxStore(initialState);
    }
});
