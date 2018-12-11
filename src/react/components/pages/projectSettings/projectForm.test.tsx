import React from "react";
import ProjectForm from "./projectForm";
import { mount } from "enzyme";
import { MockFactory } from "../../../../models/mockFactory";
import TagColors from "../../common/tagsInput/tagColors.json";

import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import { IApplicationState } from "../../../../models/applicationState";
import initialState from "../../../../redux/store/initialState";
import createReduxStore from "../../../../redux/store/store";
import ProjectSettingsPage from "./projectSettingsPage";

describe("Project Form Component", () => {
    let onSubmit: (value: any) => void;

    const mockFactory = new MockFactory();
    const project = mockFactory.project();
    const connections = mockFactory.connections();
    const defaultState: IApplicationState = initialState;
    const store = createReduxStore(defaultState);

    describe("Existing project", () => {
        onSubmit = jest.fn();
        let wrapper: any = null;

        beforeEach(() => {
            wrapper = mount(
                <Provider store={store}>
                    <Router>
                        <ProjectForm
                            project={project}
                            connections={connections}
                            onSubmit={onSubmit}/>
                    </Router>
                </Provider>,
            ).find(ProjectForm).childAt(0);
        });

        it("should have name loaded correctly", () => {
            expect(
                wrapper.state().formData.name,
            ).toEqual(
                project.name,
            );
        });

        it("should have source connection loaded correctly", () => {
            expect(
                wrapper.state().formData.sourceConnection,
            ).toEqual(
                project.sourceConnection,
            );
        });

        it("should have target connection loaded correctly", () => {
            expect(
                wrapper.state().formData.targetConnection,
            ).toEqual(
                project.targetConnection,
            );
        });

        it("should have description loaded correctly", () => {
            expect(
                wrapper.state().formData.description,
            ).toEqual(
                project.description,
            );
        });

        it("should have tags loaded correctly", () => {
            expect(
                wrapper.state().formData.tags,
            ).toEqual(
                project.tags,
            );
        });

        it("should update name upon submission", () => {
            const newName = "My new name";
            expect(wrapper.state().formData.name).not.toEqual(newName);
            expect(wrapper.state().formData.name).toEqual(project.name);
            wrapper.find("input#root_name").simulate("change", {target: {value: newName}});
            expect(wrapper.state().formData.name).toEqual(newName);
        });
    });

    describe("Empty project", () => {
        let wrapper: any = null;

        beforeEach(() => {
            wrapper = mount(
                <Provider store={store}>
                    <Router>
                        <ProjectForm
                            project={null}
                            connections={connections}
                            onSubmit={onSubmit}/>
                    </Router>
                </Provider>,
            ).find(ProjectForm).childAt(0);
        });

        it("should have name loaded correctly", () => {
            expect(
                wrapper.state().formData.name,
            ).toBe(
                undefined,
            );
        });

        it("should have source connection loaded correctly", () => {
            expect(
                wrapper.state().formData.sourceConnectionId,
            ).toBe(
                undefined,
            );
        });

        it("should have target connection loaded correctly", () => {
            expect(
                wrapper.state().formData.targetConnectionId,
            ).toBe(
                undefined,
            );
        });

        it("should have description loaded correctly", () => {
            expect(
                wrapper.state().formData.description,
            ).toBe(
                undefined,
            );
        });

        it("should have tags loaded correctly", () => {
            expect(
                wrapper.state().formData.tags,
            ).toBe(
                undefined,
            );
        });
    });
});
