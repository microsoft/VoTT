import { mount } from "enzyme";
import React from "react";
import MockFactory from "../../../../common/mockFactory";
import { IApplicationState } from "../../../../models/applicationState";
import initialState from "../../../../redux/store/initialState";
import createReduxStore from "../../../../redux/store/store";
import ProjectForm, { IProjectFormProps } from "./projectForm";

describe("Project Form Component", () => {
    let onSubmit: (value: any) => void;

    const project = MockFactory.project();
    const connections = MockFactory.connections();
    const defaultState: IApplicationState = initialState;
    const store = createReduxStore(defaultState);

    function createComponent(props: IProjectFormProps) {
        return mount(
            <ProjectForm {...props} />,
        );
    }

    describe("Existing project", () => {
        onSubmit = jest.fn();
        let wrapper: any = null;

        beforeEach(() => {
            wrapper = createComponent({
                project: project,
                connections: connections,
                onSubmit: onSubmit
            });
        });

        it("has initial state loaded correctly", () => {
            expect(
                wrapper.state().formData.name,
            ).toEqual(
                project.name,
            );

            expect(
                wrapper.state().formData.sourceConnection,
            ).toEqual(
                project.sourceConnection,
            );

            expect(
                wrapper.state().formData.targetConnection,
            ).toEqual(
                project.targetConnection,
            );

            expect(
                wrapper.state().formData.description,
            ).toEqual(
                project.description,
            );

            expect(project.tags.length).toBeGreaterThan(0);
            expect(
                JSON.parse(wrapper.state().formData.tags),
            ).toEqual(
                project.tags,
            );
        });

        it("has correct initial rendering", () => {
            expect(project.tags.length).toBeGreaterThan(0);
            expect(wrapper.find(".tag-wrapper")).toHaveLength(project.tags.length);
        });

        it("should update name upon submission", () => {
            const newName = "My new name";
            expect(wrapper.state().formData.name).not.toEqual(newName);
            expect(wrapper.state().formData.name).toEqual(project.name);
            wrapper.find("input#root_name").simulate("change", {target: {value: newName}});
            expect(wrapper.state().formData.name).toEqual(newName);

            const form = wrapper.find("form");
            form.simulate("submit");
            expect(onSubmit).toBeCalledWith({
                ...project,
                tags: JSON.stringify(project.tags),
                name: newName,
            });
        });

        it("should update description upon submission", () => {
            const newDescription = "My new description";
            expect(wrapper.state().formData.description).not.toEqual(newDescription);
            expect(wrapper.state().formData.description).toEqual(project.description);
            wrapper.find("textarea#root_description").simulate("change", {target: {value: newDescription}});
            expect(wrapper.state().formData.description).toEqual(newDescription);

            const form = wrapper.find("form");
            form.simulate("submit");
            expect(onSubmit).toBeCalledWith({
                ...project,
                tags: JSON.stringify(project.tags),
                description: newDescription,
            });
        });

        it("should update source connection ID upon submission", () => {
            const newConnectionId = "2";
            expect(wrapper.state().formData.sourceConnectionId).not.toEqual(newConnectionId);
            expect(wrapper.state().formData.sourceConnectionId).toEqual(project.sourceConnectionId);
            expect(wrapper.find("select#root_sourceConnectionId").exists()).toBe(true);
            wrapper.find("select#root_sourceConnectionId").simulate("change", {target: {value: newConnectionId}});

            expect(wrapper.state().formData.sourceConnectionId).toEqual(newConnectionId);
            const form = wrapper.find("form");
            form.simulate("submit");
            expect(onSubmit).toBeCalledWith({
                ...project,
                tags: JSON.stringify(project.tags),
                sourceConnectionId: newConnectionId,
            });

        });

        it("should update target connection ID upon submission", () => {
            const newConnectionId = "1";
            expect(wrapper.state().formData.targetConnectionId).not.toEqual(newConnectionId);
            expect(wrapper.state().formData.targetConnectionId).toEqual(project.targetConnectionId);
            expect(wrapper.find("select#root_targetConnectionId").exists()).toBe(true);
            wrapper.find("select#root_targetConnectionId").simulate("change", {target: {value: newConnectionId}});
            expect(wrapper.state().formData.targetConnectionId).toEqual(newConnectionId);
            const form = wrapper.find("form");
            form.simulate("submit");
            expect(onSubmit).toBeCalledWith({
                ...project,
                tags: JSON.stringify(project.tags),
                targetConnectionId: newConnectionId,
            });
        });

        it("should call onChangeHandler on submission with stringified tags", () => {
            const form = wrapper.find("form");
            form.simulate("submit");
            expect(onSubmit).toBeCalledWith({
                ...project,
                tags: JSON.stringify(project.tags),
            });
        });
    });

    describe("Empty project", () => {
        let wrapper: any = null;

        beforeEach(() => {
            wrapper = mount(
                <ProjectForm
                    project={null}
                    connections={connections}
                    onSubmit={onSubmit}/>
            );
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

        it("renders no tag boxes", () => {
            expect(wrapper.find(".tag-wrapper")).toHaveLength(0);
        });
    });
});
