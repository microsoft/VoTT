import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import { mount, ReactWrapper } from "enzyme";
import { AnyAction, Store } from "redux";
import ExportPage, { IExportPageProps } from "./exportPage";
import { IApplicationState, IProject } from "../../../../models/applicationState";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import createReduxStore from "../../../../redux/store/store";
import { ExportProviderFactory } from "../../../../providers/export/exportProviderFactory";

jest.mock("../../../../services/projectService");
import ProjectService from "../../../../services/projectService";

describe("Export Page", () => {
    let projectServiceMock: jest.Mocked<typeof ProjectService> = null;

    function createCompoent(store, props: IExportPageProps): ReactWrapper {
        return mount(
            <Provider store={store}>
                <Router>
                    <ExportPage {...props} />
                </Router>
            </Provider>,
        );
    }

    beforeEach(() => {
        projectServiceMock = ProjectService as jest.Mocked<typeof ProjectService>;
    });

    it("Sets project state from redux store", () => {
        const testProject = createProject();
        const store = createStore(testProject);
        const props = createProps(testProject.id);
        const loadProjectSpy = jest.spyOn(props.actions, "loadProject");

        const wrapper = createCompoent(store, props);
        const exportPage = wrapper.find(ExportPage).childAt(0);

        expect(loadProjectSpy).not.toBeCalled();
        expect(exportPage.state()["project"]).toEqual(testProject);
    });

    it("Sets project state from route params", (done) => {
        const testProject = createProject();
        const store = createStore();
        const props = createProps(testProject.id);

        const loadProjectSpy = jest.spyOn(props.actions, "loadProject");
        projectServiceMock.prototype.get = jest.fn(() => Promise.resolve(testProject));

        const wrapper = createCompoent(store, props);
        const exportPage = wrapper.find(ExportPage).childAt(0);

        setImmediate(() => {
            expect(loadProjectSpy).toHaveBeenCalledWith(testProject.id);
            expect(exportPage.state()["project"]).toEqual(testProject);
            done();
        });
    });

    it("Calls save and export project actions on form submit", (done) => {
        const testProject = createProject();
        const store = createStore(testProject);
        const props = createProps(testProject.id);

        const saveProjectSpy = jest.spyOn(props.actions, "saveProject");
        const exportProjectSpy = jest.spyOn(props.actions, "exportProject");

        ExportProviderFactory.create = jest.fn(() => {
            return {
                export: jest.fn(() => Promise.resolve()),
            };
        });

        projectServiceMock.prototype.save = jest.fn((project) => Promise.resolve(project));

        const wrapper = createCompoent(store, props);
        wrapper.find("form").simulate("submit");

        setImmediate(() => {
            expect(saveProjectSpy).toBeCalled();
            expect(exportProjectSpy).toBeCalled();
            expect(props.history.goBack).toBeCalled();

            const updatedProject = wrapper.find(ExportPage).childAt(0).state()["project"] as IProject;
            expect(updatedProject.exportFormat).not.toBeNull();
            done();
        });
    });
});

function createProject(): IProject {
    return {
        id: "project-1",
        name: "Project 1",
        assets: {},
        exportFormat: null,
        sourceConnection: {
            id: "connection-1",
            name: "Connection 1",
            providerType: "test",
            providerOptions: {},
        },
        targetConnection: {
            id: "connection-1",
            name: "Connection 1",
            providerType: "test",
            providerOptions: {},
        },
        tags: [],
        autoSave: true,
    };
}

function createProps(projectId: string): IExportPageProps {
    return {
        project: null,
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

function createStore(project?: IProject): Store<any, AnyAction> {
    const initialState: IApplicationState = {
        currentProject: project,
        appSettings: {
            connection: null,
            devToolsEnabled: false,
        },
        connections: [],
        recentProjects: project ? [project] : [],
    };

    return createReduxStore(initialState);
}
