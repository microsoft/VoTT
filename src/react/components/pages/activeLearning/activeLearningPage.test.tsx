import React from "react";
import ActiveLearningPage, { IActiveLearningPageProps, IActiveLearningPageState } from "./activeLearningPage";
import { ReactWrapper, mount } from "enzyme";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import createReduxStore from "../../../../redux/store/store";
import MockFactory from "../../../../common/mockFactory";
import { ActiveLearningForm } from "./activeLearningForm";
import { IActiveLearningSettings, ModelPathType } from "../../../../models/applicationState";
jest.mock("../../../../services/projectService");
import ProjectService from "../../../../services/projectService";
import { toast } from "react-toastify";
import { strings } from "../../../../common/strings";

describe("Active Learning Page", () => {
    function createComponent(store, props: IActiveLearningPageProps): ReactWrapper {
        return mount(
            <Provider store={store}>
                <Router>
                    <ActiveLearningPage {...props} />
                </Router>
            </Provider>,
        );
    }

    beforeAll(() => {
        toast.success = jest.fn(() => 2);
    });

    it("renders and loads settings from props", () => {
        const testProject = MockFactory.createTestProject("TestProject");
        const store = createReduxStore(MockFactory.initialState({
            currentProject: testProject,
        }));

        const props = MockFactory.activeLearningProps();
        const wrapper = createComponent(store, props);

        const activeLearningPage = wrapper
            .find(ActiveLearningPage)
            .childAt(0) as ReactWrapper<IActiveLearningPageProps, IActiveLearningPageState>;

        expect(activeLearningPage.state().settings).toEqual(testProject.activeLearningSettings);
        expect(wrapper.find(ActiveLearningForm).props().settings).toEqual(testProject.activeLearningSettings);
    });

    it("updates active learning settings if project changes", () => {
        const store = createReduxStore(MockFactory.initialState());
        const props = MockFactory.activeLearningProps();

        const testProject = props.recentProjects[0];
        const wrapper = createComponent(store, props);

        const activeLearningPage = wrapper
            .find(ActiveLearningPage)
            .childAt(0) as ReactWrapper<IActiveLearningPageProps, IActiveLearningPageState>;

        expect(activeLearningPage.state().settings).toEqual(testProject.activeLearningSettings);
        expect(wrapper.find(ActiveLearningForm).props().settings).toEqual(testProject.activeLearningSettings);
    });

    it("saves the active learning settings when the form is submitted", async () => {
        const testProject = MockFactory.createTestProject("TestProject");
        const activeLearningSettings: IActiveLearningSettings = {
            ...testProject.activeLearningSettings,
            modelPathType: ModelPathType.Url,
            modelUrl: "http://myserver.com/custommodel",
            autoDetect: true,
            predictTag: true,
        };

        const store = createReduxStore(MockFactory.initialState({
            currentProject: testProject,
        }));

        const projectServiceMock = ProjectService as jest.Mocked<typeof ProjectService>;
        projectServiceMock.prototype.load = jest.fn((project) => Promise.resolve(project));
        projectServiceMock.prototype.save = jest.fn((project) => Promise.resolve(project));

        const props = MockFactory.activeLearningProps();
        const saveProjectSpy = jest.spyOn(props.actions, "saveProject");
        saveProjectSpy.mockClear();

        const wrapper = createComponent(store, props);

        const activeLearningForm = wrapper.find(ActiveLearningForm);
        activeLearningForm.props().onSubmit(activeLearningSettings);

        await MockFactory.flushUi();

        expect(saveProjectSpy).toBeCalledWith(expect.objectContaining({
            ...testProject,
            activeLearningSettings,
        }));

        expect(toast.success).toBeCalledWith(strings.activeLearning.messages.saveSuccess);
        expect(props.history.goBack).toBeCalled();
    });

    it("returns to the previous page when the form is cancelled", async () => {
        const testProject = MockFactory.createTestProject("TestProject");
        const store = createReduxStore(MockFactory.initialState({
            currentProject: testProject,
        }));

        const props = MockFactory.activeLearningProps();
        const saveProjectSpy = jest.spyOn(props.actions, "saveProject");
        saveProjectSpy.mockClear();

        const wrapper = createComponent(store, props);

        wrapper.find(ActiveLearningForm).props().onCancel();

        await MockFactory.flushUi();
        expect(props.history.goBack).toBeCalled();
        expect(saveProjectSpy).not.toBeCalled();
    });
});
