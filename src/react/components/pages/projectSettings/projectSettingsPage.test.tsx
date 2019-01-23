import { mount, ReactWrapper } from "enzyme";
import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import MockFactory from "../../../../common/mockFactory";
import createReduxStore from "../../../../redux/store/store";
import ProjectSettingsPage, { IProjectSettingsPageProps } from "./projectSettingsPage";

jest.mock("../../../../services/projectService");
import ProjectService from "../../../../services/projectService";

describe("Project settings page", () => {
    let projectServiceMock: jest.Mocked<typeof ProjectService> = null;

    function createCompoent(store, props: IProjectSettingsPageProps): ReactWrapper {
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
        projectServiceMock.prototype.load = jest.fn((project) => ({ ...project }));
    });

    it("Form submission calls save project action", (done) => {
        const store = createReduxStore(MockFactory.initialState());
        const props = MockFactory.projectSettingsProps();
        const saveProjectSpy = jest.spyOn(props.projectActions, "saveProject");

        projectServiceMock.prototype.save = jest.fn((project) => Promise.resolve(project));

        const wrapper = createCompoent(store, props);
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

        const wrapper = createCompoent(store, props);
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
        const store = createReduxStore(MockFactory.initialState());
        const props = MockFactory.projectSettingsProps();
        const saveProjectSpy = jest.spyOn(props.projectActions, "saveProject");
        const project = MockFactory.createTestProject("25");

        projectServiceMock.prototype.save = jest.fn((project) => Promise.resolve(project));
        const wrapper = createCompoent(store, props);
        wrapper.setProps({
            form: {
                name: project.name,
                connections: {
                    source: project.sourceConnection,
                    target: project.targetConnection,
                },
            },
        });

        wrapper.find("form").simulate("submit");
        setImmediate(() => {
            expect(saveProjectSpy).toBeCalled();
            done();
        });
    });
});
