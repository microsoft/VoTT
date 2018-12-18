import { mount } from "enzyme";
import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import MockFactory from "../../../../common/mockFactory";
import ProjectForm, { IProjectFormProps } from "./projectForm";

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

    describe("Existing project", () => {
        const onSubmit = jest.fn();
        it("has initial state loaded correctly", () => {
            const wrapper = createComponent({
                project,
                connections,
                onSubmit,
            });
            expect(wrapper.state().formData.name).toEqual(project.name);
            expect(wrapper.state().formData.sourceConnection).toEqual(project.sourceConnection);
            expect(wrapper.state().formData.targetConnection).toEqual(project.targetConnection);
            expect(wrapper.state().formData.description).toEqual(project.description);
            expect(project.tags.length).toBeGreaterThan(0);
            expect((wrapper.state().formData.tags)).toEqual(project.tags);
        });

        it("has correct initial rendering", () => {
            const wrapper = createComponent({
                project,
                connections,
                onSubmit,
            });
            expect(project.tags.length).toBeGreaterThan(0);
            expect(wrapper.find(".tag-wrapper")).toHaveLength(project.tags.length);
        });

        it("should update name upon submission", () => {
            const wrapper = createComponent({
                project,
                connections,
                onSubmit,
            });
            const newName = "My new name";
            expect(wrapper.state().formData.name).not.toEqual(newName);
            expect(wrapper.state().formData.name).toEqual(project.name);
            wrapper.find("input#root_name").simulate("change", { target: { value: newName } });
            expect(wrapper.state().formData.name).toEqual(newName);

            const form = wrapper.find("form");
            form.simulate("submit");
            expect(onSubmit).toBeCalledWith({
                ...project,
\                name: newName,
            });
        });

        it("should update description upon submission", () => {
            const wrapper = createComponent({
                project,
                connections,
                onSubmit,
            });
            const newDescription = "My new description";
            expect(wrapper.state().formData.description).not.toEqual(newDescription);
            expect(wrapper.state().formData.description).toEqual(project.description);
            wrapper.find("textarea#root_description").simulate("change", { target: { value: newDescription } });
            expect(wrapper.state().formData.description).toEqual(newDescription);

            const form = wrapper.find("form");
            form.simulate("submit");
            expect(onSubmit).toBeCalledWith({
                ...project,
                description: newDescription,
            });
        });

        it("should update source connection ID upon submission", () => {
            const wrapper = createComponent({
                project,
                connections,
                onSubmit,
            });
            const newConnectionId = connections[1].id;
            expect(wrapper.state().formData.sourceConnectionId).not.toEqual(newConnectionId);
            expect(wrapper.state().formData.sourceConnectionId).toEqual(project.sourceConnectionId);
            expect(wrapper.find("select#root_sourceConnectionId").exists()).toBe(true);
            wrapper.find("select#root_sourceConnectionId").simulate("change", { target: { value: newConnectionId } });

            expect(wrapper.state().formData.sourceConnectionId).toEqual(newConnectionId);
            const form = wrapper.find("form");
            form.simulate("submit");
            expect(onSubmit).toBeCalledWith({
                ...project,
                sourceConnectionId: newConnectionId,
            });

        });

        it("should update target connection ID upon submission", () => {
            const wrapper = createComponent({
                project,
                connections,
                onSubmit,
            });
            const newConnectionId = connections[1].id;
            expect(wrapper.state().formData.targetConnectionId).not.toEqual(newConnectionId);
            expect(wrapper.state().formData.targetConnectionId).toEqual(project.targetConnectionId);
            expect(wrapper.find("select#root_targetConnectionId").exists()).toBe(true);
            wrapper.find("select#root_targetConnectionId").simulate("change", { target: { value: newConnectionId } });
            expect(wrapper.state().formData.targetConnectionId).toEqual(newConnectionId);
            const form = wrapper.find("form");
            form.simulate("submit");
            expect(onSubmit).toBeCalledWith({
                ...project,
                targetConnectionId: newConnectionId,
            });
        });

        it("should call onChangeHandler on submission with stringified tags", () => {
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
    });

    describe("Empty project", () => {
        const onSubmit = jest.fn();

        it("has initial state loaded correctly", () => {
            const wrapper = createComponent({
                project: null,
                connections,
                onSubmit,
            });
            expect(wrapper.state().formData.name).toBe(undefined);
            expect(wrapper.state().formData.sourceConnectionId).toBe(undefined);
            expect(wrapper.state().formData.targetConnectionId).toBe(undefined);
            expect(wrapper.state().formData.description).toBe(undefined);
            expect(wrapper.state().formData.tags).toBe(undefined);
        });

        it("has correct initial rendering", () => {
            const wrapper = createComponent({
                project: null,
                connections,
                onSubmit,
            });
            expect(wrapper.find(".tag-wrapper")).toHaveLength(0);
        });

        it("should not call onChangeHandler on submission because of empty required values", () => {
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
});
