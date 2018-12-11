import { mount, ReactWrapper } from "enzyme";
import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import { IApplicationState } from "../../../../models/applicationState";
import { MockFactory } from "../../../../models/mockFactory";
import initialState from "../../../../redux/store/initialState";
import createReduxStore from "../../../../redux/store/store";
import ProjectSettingsPage, { IProjectSettingsPageProps } from "./projectSettingsPage";

jest.mock("../../../../services/projectService");
import ProjectService from "../../../../services/projectService";

describe("Project settings page", () => {
    const wrapper: any = null;
    let projectServiceMock: jest.Mocked<typeof ProjectService> = null;
    const mockFactory = new MockFactory();

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

    it("Sets project state from redux store", (done) => {
        const project = mockFactory.project();
        const store = createReduxStore(mockFactory.initialState());
        const props = mockFactory.projectSettingsProps();
        const saveProjectSpy = jest.spyOn(props.projectActions, "saveProject");
        projectServiceMock.prototype.save = jest.fn((project) => Promise.resolve(project));
        const wrapper = createCompoent(store, props);
        wrapper.find("form").simulate("submit");

        setImmediate(() => {
            expect(saveProjectSpy).toBeCalled();
            done();
        });

    });

});
