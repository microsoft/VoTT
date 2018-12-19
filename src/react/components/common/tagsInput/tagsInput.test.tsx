import React from "react";
import TagsInput, { ITagsInputProps, KeyCodes } from "./tagsInput";
import { mount } from "enzyme";
import { ITag } from "../../../../models/applicationState";
import MockFactory from "../../../../common/mockFactory";
// tslint:disable-next-line:no-var-requires
const TagColors = require("./tagColors.json");

describe("Tags Input Component", () => {
    let wrapper: any = null;
    let onChangeHandler: (value: any) => void;

    const originalTags = MockFactory.createTestTags();

    function createComponent(props: ITagsInputProps) {
        return mount(
            <TagsInput {...props}/>,
        );
    }

    beforeEach(() => {
        onChangeHandler = jest.fn();
        wrapper = createComponent({
            tags: originalTags,
            onChange: onChangeHandler,
        });
    });

    it("tags are initialized correctly", () => {
        const stateTags = wrapper.state().tags;
        expect(stateTags).toHaveLength(originalTags.length);
        for (let i = 0; i < stateTags.length; i++) {
            expect(stateTags[i].id).toEqual(originalTags[i].name);
            expect(stateTags[i].color).toEqual(originalTags[i].color);
            expect(stateTags[i].text).not.toBeNull();
        }
    });

    it("renders appropriate number of color boxes", () => {
        expect(wrapper.find("div.inline-block.tag_color_box")).toHaveLength(originalTags.length);
    });

    it("one text input field is available", () => {
        expect(wrapper.find("input")).toHaveLength(1);
    });

    it("create a new tag from text box - enter key", () => {
        const newTagName = "My new tag";
        wrapper.find("input").simulate("change", {target: {value: newTagName}});
        wrapper.find("input").simulate("keyDown", {keyCode: KeyCodes.enter});
        expect(onChangeHandler).toBeCalled();
        expect(wrapper.state().tags).toHaveLength(originalTags.length + 1);
        const newTagIndex = originalTags.length;
        expect(wrapper.state().tags[newTagIndex].id).toEqual(newTagName);
        expect(TagColors).toContain(wrapper.state().tags[newTagIndex].color);
    });

    it("create a new tag from text box - comma key", () => {
        const newTagName = "My new tag";
        wrapper.find("input").simulate("change", {target: {value: newTagName}});
        wrapper.find("input").simulate("keyDown", {keyCode: KeyCodes.comma});
        expect(onChangeHandler).toBeCalled();
        expect(wrapper.state().tags).toHaveLength(originalTags.length + 1);
        const newTagIndex = originalTags.length;
        expect(wrapper.state().tags[newTagIndex].id).toEqual(newTagName);
        expect(TagColors).toContain(wrapper.state().tags[newTagIndex].color);
    });

    it("remove a tag", () => {
        expect(wrapper.state().tags).toHaveLength(originalTags.length);
        wrapper.find("a.ReactTags__remove")
            .last().simulate("click");
        expect(onChangeHandler).toBeCalled();
        expect(wrapper.state().tags).toHaveLength(originalTags.length - 1);
        expect(wrapper.state().tags[0].id).toEqual(originalTags[0].name);
        expect(wrapper.state().tags[0].color).toEqual(originalTags[0].color);
    });

    it("double click tag opens modal", () => {
        expect(wrapper.state().showModal).toBeFalsy();
        wrapper.find("div.inline-block.tagtext")
            .first()
            .simulate("dblclick", { target: { innerText: originalTags[0].name}});
        expect(wrapper.state().showModal).toBeTruthy();
    });

    it("double click tag sets selected tag", () => {
        wrapper.find("div.inline-block.tagtext")
            .first()
            .simulate("dblclick", { target: { innerText: originalTags[0].name}});
        expect(wrapper.state().selectedTag.id).toEqual(originalTags[0].name);
        expect(wrapper.state().selectedTag.color).toEqual(originalTags[0].color);
    });

    it("clicking 'ok' in modal closes and calls onChangeHandler", () => {
        wrapper.find("div.inline-block.tagtext")
            .first()
            .simulate("dblclick", { target: { innerText: originalTags[0].name}});
        wrapper.find("button")
            .last()
            .simulate("click");
        expect(wrapper.state().showModal).toBeFalsy();
        expect(onChangeHandler).toBeCalled();
    });

    it("clicking 'cancel' in modal closes and does not call onChangeHandler", () => {
        wrapper.find("div.inline-block.tagtext")
            .first()
            .simulate("dblclick", { target: { innerText: originalTags[0].name}});
        wrapper.find("button")
            .first()
            .simulate("click");
        expect(wrapper.state().showModal).toBeFalsy();
        expect(onChangeHandler).not.toBeCalled();
    });

    it("typing backspace on empty field does NOT delete tag", () => {
        // Root component calls handleDelete when backspace is pressed
        // Component should handle backspace and return, not deleting and not calling onChange
        wrapper.find("input").simulate("keyDown", {keyCode: KeyCodes.backspace}); // backspace
        expect(onChangeHandler).not.toBeCalled();
        expect(wrapper.state().tags).toHaveLength(originalTags.length);
    });
});
