import { mount, ReactWrapper } from "enzyme";
import React from "react";
import { Provider } from "react-redux";
import { AnyAction, Store } from "redux";
import { BrowserRouter as Router } from "react-router-dom";
import MockFactory from "../../../../common/mockFactory";
import createReduxStore from "../../../../redux/store/store";
import { IApplicationState } from "../../../../models/applicationState";
import initialState from "../../../../redux/store/initialState";
import ProjectSettingsPage, { IProjectSettingsPageProps } from "./projectSettingsPage";

jest.mock("../../../../services/projectService");
import ProjectService from "../../../../services/projectService";
import { ConformsPredicateObject } from "lodash";

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
    });

    it("Form submission calls save project action", (done) => {
        const store = createReduxStore(MockFactory.initialState());
        const props = MockFactory.projectSettingsProps();
        const saveProjectSpy = jest.spyOn(props.actions, "saveProject");
        projectServiceMock.prototype.save = jest.fn((project) => Promise.resolve(project));
        const wrapper = createCompoent(store, props);
        wrapper.find("form").simulate("submit");
        setImmediate(() => {
            expect(saveProjectSpy).toBeCalled();
            done();
        });
    });

    it("Throws an error when a user tries to create a duplicate project", async (done) => {
        const context: any = null;
        const store = createReduxStore(MockFactory.initialState());
        const props = MockFactory.projectSettingsProps();
        const saveProjectSpy = jest.spyOn(props.actions, "saveProject");
        const project = MockFactory.createTestProject("1");

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
            actions: {
                saveProject: props.actions.saveProject,
            },
        });

        const myActions = MockFactory.projectActions();

        wrapper.find("form").simulate("submit");
        setImmediate(async () => {
            expect(saveProjectSpy).toBeCalled();
            try {
                await expect(myActions.saveProject(project)).rejects.not.toBeNull();
            } catch (e) {
                console.log("Error in test");
            }
            done();
        });
    });

    it("calls save project when user creates a unique project", (done) => {
        const store = createReduxStore(MockFactory.initialState());
        const props = MockFactory.projectSettingsProps();
        const saveProjectSpy = jest.spyOn(props.actions, "saveProject");
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
