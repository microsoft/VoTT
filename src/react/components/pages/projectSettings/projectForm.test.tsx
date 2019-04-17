import { mount, ReactWrapper } from "enzyme";
import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import MockFactory from "../../../../common/mockFactory";
import { KeyCodes } from "../../../../common/utils";
import registerProviders from "../../../../registerProviders";
import ProjectForm, { IProjectFormProps, IProjectFormState } from "./projectForm";
import { IProjectVideoSettings } from "../../../../models/applicationState";
import { SecurityTokenPicker } from "../../common/securityTokenPicker/securityTokenPicker";
import { ConnectionPickerWithRouter } from "../../common/connectionPicker/connectionPicker";
import { TagsInput } from "vott-react";

describe("Project Form Component", () => {
    const project = MockFactory.createTestProject("TestProject");
    const appSettings = MockFactory.appSettings();
    const connections = MockFactory.createTestConnections();
    let wrapper: ReactWrapper<IProjectFormProps, IProjectFormState> = null;
    const onSubmitHandler = jest.fn();
    const onChangeHandler = jest.fn();
    const onCancelHandler = jest.fn();

    function createComponent(props: IProjectFormProps) {
        return mount(
            <Router>
                <ProjectForm
                    {...props} />
            </Router>,
        ).find(ProjectForm).childAt(0);
    }

    beforeAll(() => {
        registerProviders();
    });

    describe("Completed project", () => {
        beforeEach(() => {
            onChangeHandler.mockClear();
            onSubmitHandler.mockClear();
            onCancelHandler.mockClear();

            wrapper = createComponent({
                project,
                connections,
                appSettings,
                onSubmit: onSubmitHandler,
                onChange: onChangeHandler,
                onCancel: onCancelHandler,
            });
        });

        it("renders the form correctly", () => {
            expect(wrapper.find(SecurityTokenPicker)).toHaveLength(1);
            expect(wrapper.find(ConnectionPickerWithRouter)).toHaveLength(2);
            expect(wrapper.find(TagsInput)).toHaveLength(1);
        });

        it("starting project has initial state loaded correctly", () => {
            const formData = wrapper.state().formData;
            expect(formData.name).toEqual(project.name);
            expect(formData.sourceConnection).toEqual(project.sourceConnection);
            expect(formData.targetConnection).toEqual(project.targetConnection);
            expect(formData.videoSettings).toEqual(project.videoSettings);
            expect(formData.description).toEqual(project.description);
            expect(project.tags.length).toBeGreaterThan(0);
            expect(formData.tags).toEqual(project.tags);
        });

        it("starting project has correct initial rendering", () => {
            expect(project.tags.length).toBeGreaterThan(0);
            expect(wrapper.find(".tag-wrapper")).toHaveLength(project.tags.length);
        });

        it("starting project should update name upon submission", () => {
            const newName = "My new name";
            const currentName = wrapper.state().formData.name;
            expect(currentName).not.toEqual(newName);
            expect(currentName).toEqual(project.name);
            wrapper.find("input#root_name").simulate("change", { target: { value: newName } });
            expect(wrapper.state().formData.name).toEqual(newName);

            const form = wrapper.find("form");
            form.simulate("submit");

            const expectedProject = {
                ...project,
                name: newName,
            };

            expect(onChangeHandler).toBeCalled();
            expect(onSubmitHandler).toBeCalledWith(expectedProject);
        });

        it("starting project should update description upon submission", () => {
            const newDescription = "My new description";
            const currentDescription = wrapper.state().formData.description;
            expect(currentDescription).not.toEqual(newDescription);
            expect(currentDescription).toEqual(project.description);
            wrapper.find("textarea#root_description").simulate("change", { target: { value: newDescription } });
            expect(wrapper.state().formData.description).toEqual(newDescription);

            const form = wrapper.find("form");
            form.simulate("submit");

            const expectedProject = {
                ...project,
                description: newDescription,
            };

            expect(onChangeHandler).toBeCalledWith(expect.objectContaining(project));
            expect(onSubmitHandler).toBeCalledWith(expectedProject);
        });

        it("starting project should update source connection ID upon submission", () => {
            const newConnection = connections[1];
            const currentConnectionId = wrapper.state().formData.sourceConnection.id;
            expect(currentConnectionId).not.toEqual(newConnection.id);
            expect(currentConnectionId).toEqual(project.sourceConnection.id);
            expect(wrapper.find("select#root_sourceConnection").exists()).toBe(true);
            wrapper.find("select#root_sourceConnection").simulate("change", { target: { value: newConnection.id } });

            expect(wrapper.state().formData.sourceConnection).toEqual(newConnection);
            const form = wrapper.find("form");
            form.simulate("submit");

            const expectedProject = {
                ...project,
                sourceConnection: connections[1],
            };

            expect(onChangeHandler).toBeCalledWith(expect.objectContaining(project));
            expect(onSubmitHandler).toBeCalledWith(expectedProject);
        });

        it("starting project should update target connection ID upon submission", () => {
            const newConnection = connections[1];
            const currentConnectionId = wrapper.state().formData.targetConnection.id;
            expect(currentConnectionId).not.toEqual(newConnection.id);
            expect(currentConnectionId).toEqual(project.targetConnection.id);
            expect(wrapper.find("select#root_targetConnection").exists()).toBe(true);
            wrapper.find("select#root_targetConnection").simulate("change", { target: { value: newConnection.id } });
            expect(wrapper.state().formData.targetConnection).toEqual(newConnection);
            wrapper.find("form").simulate("submit");

            const expectedProject = {
                ...project,
                targetConnection: connections[1],
            };

            expect(onChangeHandler).toBeCalledWith(expect.objectContaining(project));
            expect(onSubmitHandler).toBeCalledWith(expectedProject);
        });

        it("starting project should call onSubmitHandler on submission", () => {
            const form = wrapper.find("form");
            form.simulate("submit");
            expect(onSubmitHandler).toBeCalledWith({
                ...project,
            });
        });

        it("starting project should edit fields and submit project", () => {
            const newName = "My new name";
            const newConnection = connections[1];
            const newDescription = "My new description";
            const newTagName = "My new tag";
            const regX = new RegExp(/^#([0-9a-fA-F]{3}){1,2}$/i);

            wrapper.find("input#root_name").simulate("change", { target: { value: newName } });
            wrapper.find("select#root_sourceConnection").simulate("change", { target: { value: newConnection.id } });
            wrapper.find("select#root_targetConnection").simulate("change", { target: { value: newConnection.id } });
            wrapper.find("textarea#root_description").simulate("change", { target: { value: newDescription } });
            wrapper.find("input.ReactTags__tagInputField").simulate("change", { target: { value: newTagName } });
            wrapper.find("input.ReactTags__tagInputField").simulate("keyDown", { keyCode: KeyCodes.enter });

            const form = wrapper.find("form");
            form.simulate("submit");
            expect(onChangeHandler).toBeCalledWith(expect.objectContaining(project));
            expect(onSubmitHandler).toBeCalledWith(
                expect.objectContaining({
                    name: newName,
                    sourceConnection: connections[1],
                    targetConnection: connections[1],
                    description: newDescription,
                    tags: expect.arrayContaining([
                        ...project.tags,
                        {
                            name: newTagName,
                            color: expect.stringMatching(regX),
                        },
                    ]),
                }),
            );
        });

        it("Canceling the form calls the specified onChange handler", () => {
            const cancelButton = wrapper.find("form .btn-cancel");
            cancelButton.simulate("click");
            expect(onCancelHandler).toBeCalled();
        });

        it("Does not include asset providers in target connections", () => {
            const bingConnections = MockFactory.createTestBingConnections();
            const newConnections = [...connections, ...bingConnections];

            const newWrapper = createComponent({
                project,
                appSettings,
                connections: newConnections,
                onSubmit: onSubmitHandler,
                onChange: onChangeHandler,
                onCancel: onCancelHandler,
            });
            // Source Connection should have all connections
            expect(newWrapper.find("select#root_sourceConnection .connection-option")).toHaveLength(
                newConnections.length,
            );
            // Target Connection should not have asset provider connections
            expect(newWrapper.find("select#root_targetConnection .connection-option")).toHaveLength(
                newConnections.length - bingConnections.length,
            );
        });
    });

    describe("Empty Project", () => {
        beforeEach(() => {
            wrapper = createComponent({
                project: null,
                appSettings,
                connections,
                onSubmit: onSubmitHandler,
                onChange: onChangeHandler,
                onCancel: onCancelHandler,
            });
        });
        it("Has initial state loaded correctly", () => {
            const formData = wrapper.state().formData;
            const defaultVideoSettings: IProjectVideoSettings = { frameExtractionRate: 15 };
            expect(formData.name).toBe(undefined);
            expect(formData.sourceConnection).toEqual({});
            expect(formData.targetConnection).toEqual({});
            expect(formData.videoSettings).toEqual(defaultVideoSettings);
            expect(formData.description).toBe(undefined);
            expect(formData.tags).toBe(undefined);
        });

        it("Has correct initial rendering", () => {
            expect(wrapper.find(".tag-wrapper")).toHaveLength(0);
        });

        it("Should not call onChangeHandler on submission because of empty required values", () => {
            const form = wrapper.find("form");
            form.simulate("submit");
            expect(onSubmitHandler).not.toBeCalled();
        });

        it("create a new tag when no tags exist", () => {
            wrapper = createComponent({
                project: null,
                appSettings,
                connections,
                onSubmit: onSubmitHandler,
                onChange: onChangeHandler,
                onCancel: onCancelHandler,
            });
            const newTagName = "My new tag";
            wrapper.find("input").last().simulate("change", { target: { value: newTagName } });
            wrapper.find("input").last().simulate("keyDown", { keyCode: 13 });

            const tags = wrapper.state().formData.tags;
            expect(tags).toHaveLength(1);
            expect(tags[0].name).toEqual(newTagName);
        });
    });
});
