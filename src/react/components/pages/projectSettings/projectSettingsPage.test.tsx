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
    const wrapper: any = null;
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
