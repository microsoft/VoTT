import { mount } from "enzyme";
import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import MockFactory from "../../../../common/mockFactory";
import { KeyCodes } from "../../common/tagsInput/tagsInput";
import ProjectForm, { IProjectFormProps } from "./projectForm";
import { IProject } from "../../../../models/applicationState";

describe("Project Form Component", () => {

    const project = MockFactory.createTestProject("TestProject");
    const connections = MockFactory.createTestConnections();

    function createComponent(props: IProjectFormProps) {
        return mount(
            <Router>
                <ProjectForm
                    {...props} />
            </Router>,
        ).find(ProjectForm).childAt(0);
    }

    it("starting project has initial state loaded correctly", () => {
        const onSubmit = jest.fn();
        const wrapper = createComponent({
            project,
            connections,
            onSubmit,
        });
        const formData = wrapper.state().formData;
        expect(formData.name).toEqual(project.name);
        expect(formData.sourceConnection).toEqual(project.sourceConnection);
        expect(formData.targetConnection).toEqual(project.targetConnection);
        expect(formData.description).toEqual(project.description);
        expect(project.tags.length).toBeGreaterThan(0);
        expect(formData.tags).toEqual(project.tags);
    });

    it("starting project has correct initial rendering", () => {
        const onSubmit = jest.fn();
        const wrapper = createComponent({
            project,
            connections,
            onSubmit,
        });
        expect(project.tags.length).toBeGreaterThan(0);
        expect(wrapper.find(".tag-wrapper")).toHaveLength(project.tags.length);
    });

    it("starting project should update name upon submission", () => {
        const onSubmit = jest.fn();
        const wrapper = createComponent({
            project,
            connections,
            onSubmit,
        });
        const newName = "My new name";
        const currentName = wrapper.state().formData.name;
        expect(currentName).not.toEqual(newName);
        expect(currentName).toEqual(project.name);
        wrapper.find("input#root_name").simulate("change", { target: { value: newName } });
        expect(wrapper.state().formData.name).toEqual(newName);

        const form = wrapper.find("form");
        form.simulate("submit");
        expect(onSubmit).toBeCalledWith({
            ...project,
            name: newName,
        });
    });

    it("starting project should update description upon submission", () => {
        const onSubmit = jest.fn();
        const wrapper = createComponent({
            project,
            connections,
            onSubmit,
        });
        const newDescription = "My new description";
        const currentDescription = wrapper.state().formData.description;
        expect(currentDescription).not.toEqual(newDescription);
        expect(currentDescription).toEqual(project.description);
        wrapper.find("textarea#root_description").simulate("change", { target: { value: newDescription } });
        expect(wrapper.state().formData.description).toEqual(newDescription);

        const form = wrapper.find("form");
        form.simulate("submit");
        expect(onSubmit).toBeCalledWith({
            ...project,
            description: newDescription,
        });
    });

    it("starting project should update source connection ID upon submission", () => {
        const onSubmit = jest.fn();
        const wrapper = createComponent({
            project,
            connections,
            onSubmit,
        });
        const newConnection = connections[1];
        const currentConnectionId = wrapper.state().formData.sourceConnection.id;
        expect(currentConnectionId).not.toEqual(newConnection.id);
        expect(currentConnectionId).toEqual(project.sourceConnection.id);
        expect(wrapper.find("select#root_sourceConnection").exists()).toBe(true);
        wrapper.find("select#root_sourceConnection").simulate("change", { target: { value: newConnection.id } });

        expect(wrapper.state().formData.sourceConnection).toEqual(newConnection);
        const form = wrapper.find("form");
        form.simulate("submit");
        expect(onSubmit).toBeCalledWith({
            ...project,
            sourceConnection: connections[1],
        });

    });

    it("starting project should update target connection ID upon submission", () => {
        const onSubmit = jest.fn();
        const wrapper = createComponent({
            project,
            connections,
            onSubmit,
        });
        const newConnection = connections[1];
        const currentConnectionId = wrapper.state().formData.targetConnection.id;
        expect(currentConnectionId).not.toEqual(newConnection.id);
        expect(currentConnectionId).toEqual(project.targetConnection.id);
        expect(wrapper.find("select#root_targetConnection").exists()).toBe(true);
        wrapper.find("select#root_targetConnection").simulate("change", { target: { value: newConnection.id } });
        expect(wrapper.state().formData.targetConnection).toEqual(newConnection);
        wrapper.find("form").simulate("submit");
        expect(onSubmit).toBeCalledWith({
            ...project,
            targetConnection: connections[1],
        });
    });

    it("starting project should call onChangeHandler on submission", () => {
        const onSubmit = jest.fn();
        const wrapper = createComponent({
            project,
            connections,
            onSubmit,
        });
        const form = wrapper.find("form");
        form.simulate("submit");
        expect(onSubmit).toBeCalledWith({
            ...project,
        });
    });

    it("starting project should edit fields and submit project", () => {
        const onSubmit = jest.fn();
        const wrapper = createComponent({
            project,
            connections,
            onSubmit,
        });

        const newName = "My new name";
        const newConnection = connections[1];
        const newDescription = "My new description";
        const newTagName = "My new tag";

        wrapper.find("input#root_name").simulate("change", { target: { value: newName } });
        wrapper.find("select#root_sourceConnection").simulate("change", { target: { value: newConnection.id } });
        wrapper.find("select#root_targetConnection").simulate("change", { target: { value: newConnection.id } });
        wrapper.find("textarea#root_description").simulate("change", { target: { value: newDescription } });
        wrapper.find("input.ReactTags__tagInputField").simulate("change", {target: {value: newTagName}});
        wrapper.find("input.ReactTags__tagInputField").simulate("keyDown", {keyCode: KeyCodes.enter});

        const form = wrapper.find("form");
        form.simulate("submit");
        expect(onSubmit).toBeCalledWith(
            expect.objectContaining({
                name: newName,
                sourceConnection: connections[1],
                targetConnection: connections[1],
                description: newDescription,
                tags: expect.arrayContaining([
                    ...project.tags,
                    {
                        name: newTagName,
                        color: expect.stringMatching(/^#([0-9a-fA-F]{3}){1,2}$/i),
                    },
                ]),
            }),
        );
    });

    it("empty project has initial state loaded correctly", () => {
        const onSubmit = jest.fn();
        const wrapper = createComponent({
            project: null,
            connections,
            onSubmit,
        });
        const formData = wrapper.state().formData;
        expect(formData.name).toBe(undefined);
        expect(formData.sourceConnection).toEqual({});
        expect(formData.targetConnection).toEqual({});
        expect(formData.description).toBe(undefined);
        expect(formData.tags).toBe(undefined);
    });

    it("empty project has correct initial rendering", () => {
        const onSubmit = jest.fn();
        const wrapper = createComponent({
            project: null,
            connections,
            onSubmit,
        });
        expect(wrapper.find(".tag-wrapper")).toHaveLength(0);
    });

    it("empty project should not call onChangeHandler on submission because of empty required values", () => {
        const onSubmit = jest.fn();
        const wrapper = createComponent({
            project: null,
            connections,
            onSubmit,
        });
        const form = wrapper.find("form");
        form.simulate("submit");
        expect(onSubmit).not.toBeCalled();
    });
});
