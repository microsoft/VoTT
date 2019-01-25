import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import { mount, ReactWrapper } from "enzyme";
import { AnyAction, Store } from "redux";
import ExportPage, { IExportPageProps } from "./exportPage";
import { IApplicationState, IProject } from "../../../../models/applicationState";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import createReduxStore from "../../../../redux/store/store";
import MockFactory from "../../../../common/mockFactory";

jest.mock("../../../../services/projectService");
import ProjectService from "../../../../services/projectService";

jest.mock("../../../../providers/export/exportProviderFactory");
import { ExportProviderFactory } from "../../../../providers/export/exportProviderFactory";

describe("Export Page", () => {
    const exportProviderRegistrations = MockFactory.createExportProviderRegistrations();
    let projectServiceMock: jest.Mocked<typeof ProjectService> = null;

    function createComponent(store, props: IExportPageProps): ReactWrapper {
        return mount(
            <Provider store={store}>
                <Router>
                    <ExportPage {...props} />
                </Router>
            </Provider>,
        );
    }

    beforeAll(() => {
        Object.defineProperty(ExportProviderFactory, "providers", {
            get: jest.fn(() => exportProviderRegistrations),
        });
        Object.defineProperty(ExportProviderFactory, "defaultProvider", {
            get: jest.fn(() => exportProviderRegistrations[0]),
        });
    });

    beforeEach(() => {
        projectServiceMock = ProjectService as jest.Mocked<typeof ProjectService>;
    });

    it("Sets project state from redux store", () => {
        const testProject = MockFactory.createTestProject("TestProject");
        const store = createStore(testProject, true);
        const props = createProps(testProject.id);
        const loadProjectSpy = jest.spyOn(props.actions, "loadProject");

        const wrapper = createComponent(store, props);
        const exportPage = wrapper.find(ExportPage).childAt(0);

        expect(loadProjectSpy).not.toBeCalled();
        expect(exportPage.prop("project")).toEqual(testProject);
    });

    it("Sets project state from route params", (done) => {
        const testProject = MockFactory.createTestProject("TestProject");
        const store = createStore(testProject, false);
        const props = createProps(testProject.id);
        const loadProjectSpy = jest.spyOn(props.actions, "loadProject");

        const wrapper = createComponent(store, props);
        const exportPage = wrapper.find(ExportPage).childAt(0);

        setImmediate(() => {
            expect(loadProjectSpy).toHaveBeenCalledWith(testProject);
            expect(exportPage.prop("project")).toEqual(testProject);
            done();
        });
    });

    it("Calls save project actions on form submit", (done) => {
        const testProject = MockFactory.createTestProject("TestProject");
        const store = createStore(testProject, true);
        const props = createProps(testProject.id);

        const saveProjectSpy = jest.spyOn(props.actions, "saveProject");
        const exportProjectSpy = jest.spyOn(props.actions, "exportProject");

        ExportProviderFactory.create = jest.fn(() => {
            return {
                export: jest.fn(() => Promise.resolve()),
            };
        });

        projectServiceMock.prototype.save = jest.fn((project) => Promise.resolve(project));

        const wrapper = createComponent(store, props);
        wrapper.find("form").simulate("submit");
        wrapper.update();

        setImmediate(() => {
            expect(saveProjectSpy).toBeCalled();
            expect(exportProjectSpy).not.toBeCalled();
            expect(props.history.goBack).toBeCalled();

            const state = store.getState() as IApplicationState;
            expect(state.currentProject.exportFormat).not.toBeNull();
            done();
        });
    });
});

function createProps(projectId: string): IExportPageProps {
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
        appSettings: MockFactory.appSettings(),
        connections: [],
        recentProjects: [project],
    };

    return createReduxStore(initialState);
}
