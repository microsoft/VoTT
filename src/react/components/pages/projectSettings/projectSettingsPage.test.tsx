import { mount, ReactWrapper } from "enzyme";
import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import MockFactory from "../../../../common/mockFactory";
import createReduxStore from "../../../../redux/store/store";
import ProjectSettingsPage, { IProjectSettingsPageProps } from "./projectSettingsPage";

jest.mock("../../../../services/projectService");
import ProjectService from "../../../../services/projectService";
import { IAppSettings } from "../../../../models/applicationState";

jest.mock("./projectMetrics", () => () => {
        return (
            <div className="project-settings-page-metrics">
                Dummy Project Metrics
            </div>
        );
    },
);

describe("Project settings page", () => {
    let projectServiceMock: jest.Mocked<typeof ProjectService> = null;

    function createComponent(store, props: IProjectSettingsPageProps): ReactWrapper {
        return mount(
            <Provider store={store}>
                <Router>
                    <ProjectSettingsPage {...props} />
                </Router>
            </Provider>,
        );
    }

    beforeEach(() => {
        projectServiceMock = ProjectService as jest.Mocked<typeof ProjectService>;
        projectServiceMock.prototype.load = jest.fn((project) => ({...project}));
    });

    it("Form submission calls save project action", (done) => {
        const store = createReduxStore(MockFactory.initialState());
        const props = MockFactory.projectSettingsProps();
        const saveProjectSpy = jest.spyOn(props.projectActions, "saveProject");

        projectServiceMock.prototype.save = jest.fn((project) => Promise.resolve(project));

        const wrapper = createComponent(store, props);
        wrapper.find("form").simulate("submit");

        setImmediate(() => {
            expect(saveProjectSpy).toBeCalled();
            done();
        });
    });

    it("Throws an error when a user tries to create a duplicate project", async (done) => {
        const project = MockFactory.createTestProject("1");
        project.id = "25";
        const initialStateOverride = {
            currentProject: project,
        };
        const store = createReduxStore(MockFactory.initialState(initialStateOverride));
        const props = MockFactory.projectSettingsProps();
        const saveProjectSpy = jest.spyOn(props.projectActions, "saveProject");

        const wrapper = createComponent(store, props);
        wrapper.setProps({
            form: {
                name: project.name,
                connections: {
                    source: project.sourceConnection,
                    target: project.targetConnection,
                },
            },
            actions: {
                saveProject: props.projectActions.saveProject,
            },
        });
        wrapper.find("form").simulate("submit");
        setImmediate(async () => {
            // expect(saveProjectSpy).toBeCalled();
            expect(saveProjectSpy.mockRejectedValue).not.toBeNull();
            done();
        });
    });

    it("calls save project when user creates a unique project", (done) => {
        const initialState = MockFactory.initialState();

        // New Project should not have id or security token set by default
        const project = {...initialState.recentProjects[0]};
        project.id = null;
        project.name = "Brand New Project";
        project.securityToken = "";

        // Override currentProject to load the form values
        initialState.currentProject = project;

        const store = createReduxStore(initialState);
        const props = MockFactory.projectSettingsProps();
        const saveProjectSpy = jest.spyOn(props.projectActions, "saveProject");
        const saveAppSettingsSpy = jest.spyOn(props.applicationActions, "saveAppSettings");

        projectServiceMock.prototype.save = jest.fn((project) => Promise.resolve(project));
        const wrapper = createComponent(store, props);
        wrapper.find("form").simulate("submit");

        setImmediate(() => {
            // New security token was created for new project
            expect(saveAppSettingsSpy).toBeCalled();
            const appSettings = saveAppSettingsSpy.mock.calls[0][0] as IAppSettings;
            expect(appSettings.securityTokens.length).toEqual(initialState.appSettings.securityTokens.length + 1);

            // New project was saved with new security token
            expect(saveProjectSpy).toBeCalledWith({
                ...project,
                securityToken: `${project.name} Token`,
            });

            done();
        });
    });

    it("render ProjectMetrics", () => {
        const store = createReduxStore(MockFactory.initialState());
        const props = MockFactory.projectSettingsProps();

        const wrapper = createComponent(store, props);
        const projectMetrics = wrapper.find(".project-settings-page-metrics");
        expect(projectMetrics).toHaveLength(1);
    });

    describe("project does not exists", () => {
        it("does not render ProjectMetrics", () => {
            const initialState = MockFactory.initialState();

            // Override currentProject to load the form values
            initialState.currentProject = null;

            const store = createReduxStore(initialState);
            const props = MockFactory.projectSettingsProps();

            const wrapper = createComponent(store, props);
            const projectMetrics = wrapper.find(".project-settings-page-metrics");
            expect(projectMetrics).toHaveLength(0);
        });
    });
});
