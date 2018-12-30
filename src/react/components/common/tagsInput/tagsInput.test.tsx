import { mount } from "enzyme";
import React from "react";
import MockFactory from "../../../../common/mockFactory";
import TagsInput, { ITagsInputProps, KeyCodes } from "./tagsInput";
// tslint:disable-next-line:no-var-requires
const TagColors = require("./tagColors.json");

describe("Tags Input Component", () => {

    const originalTags = MockFactory.createTestTags();

    function createComponent(props: ITagsInputProps) {
        return mount(
            <TagsInput {...props}/>,
        );
    }

    it("tags are initialized correctly", () => {
        const onChangeHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            onChange: onChangeHandler,
        });
        const stateTags = wrapper.find(TagsInput).state().tags;
        expect(stateTags).toHaveLength(originalTags.length);
        for (let i = 0; i < stateTags.length; i++) {
            expect(stateTags[i].id).toEqual(originalTags[i].name);
            expect(stateTags[i].color).toEqual(originalTags[i].color);
            expect(stateTags[i].text).not.toBeNull();
        }
    });

    it("renders appropriate number of color boxes", () => {
        const onChangeHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            onChange: onChangeHandler,
        });
        expect(wrapper.find("div.inline-block.tag_color_box")).toHaveLength(originalTags.length);
    });

    it("one text input field is available", () => {
        const onChangeHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            onChange: onChangeHandler,
        });
        expect(wrapper.find("input")).toHaveLength(1);
    });

    it("create a new tag from text box - enter key", () => {
        const onChangeHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            onChange: onChangeHandler,
        });
        const newTagName = "My new tag";
        wrapper.find("input").simulate("change", {target: {value: newTagName}});
        wrapper.find("input").simulate("keyDown", {keyCode: KeyCodes.enter});
        expect(onChangeHandler).toBeCalled();
        expect(wrapper.find(TagsInput).state().tags).toHaveLength(originalTags.length + 1);
        const newTagIndex = originalTags.length;
        expect(wrapper.find(TagsInput).state().tags[newTagIndex].id).toEqual(newTagName);
        expect(TagColors).toContain(wrapper.find(TagsInput).state().tags[newTagIndex].color);
    });

    it("create a new tag from text box - comma key", () => {
        const onChangeHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            onChange: onChangeHandler,
        });
        const newTagName = "My new tag";
        wrapper.find("input").simulate("change", {target: {value: newTagName}});
        wrapper.find("input").simulate("keyDown", {keyCode: KeyCodes.comma});
        expect(onChangeHandler).toBeCalled();
        expect(wrapper.find(TagsInput).state().tags).toHaveLength(originalTags.length + 1);
        const newTagIndex = originalTags.length;
        expect(wrapper.find(TagsInput).state().tags[newTagIndex].id).toEqual(newTagName);
        expect(TagColors).toContain(wrapper.find(TagsInput).state().tags[newTagIndex].color);
    });

    it("remove a tag", () => {
        const onChangeHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            onChange: onChangeHandler,
        });
        expect(wrapper.find(TagsInput).state().tags).toHaveLength(originalTags.length);
        wrapper.find("a.ReactTags__remove")
            .last().simulate("click");
        expect(onChangeHandler).toBeCalled();
        expect(wrapper.find(TagsInput).state().tags).toHaveLength(originalTags.length - 1);
        expect(wrapper.find(TagsInput).state().tags[0].id).toEqual(originalTags[0].name);
        expect(wrapper.find(TagsInput).state().tags[0].color).toEqual(originalTags[0].color);
    });

    it("typing backspace on empty field does NOT delete tag", () => {
        const onChangeHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            onChange: onChangeHandler,
        });
        // Root component calls handleDelete when backspace is pressed
        // Component should handle backspace and return, not deleting and not calling onChange
        wrapper.find("input").simulate("keyDown", {keyCode: KeyCodes.backspace}); // backspace
        expect(onChangeHandler).not.toBeCalled();
        expect(wrapper.find(TagsInput).state().tags).toHaveLength(originalTags.length);
    });

    it("ctrl clicking tag opens editor modal", () => {
        const onChangeHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            onChange: onChangeHandler,
        });
        expect(wrapper.find(TagsInput).state().showModal).toBe(false);
        wrapper.find("div.inline-block.tagtext")
            .first()
            .simulate("click", { target: { innerText: originalTags[0].name}, ctrlKey: true});
        expect(wrapper.find(TagsInput).state().showModal).toBe(true);
    });

    it("ctrl clicking tag sets selected tag", () => {
        const onChangeHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            onChange: onChangeHandler,
        });
        wrapper.find("div.inline-block.tagtext")
            .first()
            .simulate("click", { target: { innerText: originalTags[0].name}, ctrlKey: true});
        expect(wrapper.find(TagsInput).state().selectedTag.id).toEqual(originalTags[0].name);
        expect(wrapper.find(TagsInput).state().selectedTag.color).toEqual(originalTags[0].color);
    });

    it("ctrl clicking tag does not call onTagClick or OnTagShiftClick", () => {
        const onChangeHandler = jest.fn();
        const onTagClickHandler = jest.fn();
        const onTagShiftClickHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            onChange: onChangeHandler,
            onTagShiftClick: onTagShiftClickHandler,
            onTagClick: onTagClickHandler,
        });
        wrapper.find("div.inline-block.tagtext")
            .first()
            .simulate("click", { target: { innerText: originalTags[0].name}, ctrlKey: true});
        // Shows modal
        expect(wrapper.find(TagsInput).state().showModal).toBe(true);
        // Does not Call onTagShiftClick
        expect(onTagShiftClickHandler).not.toBeCalled();
        // Does not call onTagClick
        expect(onTagClickHandler).not.toBeCalled();
    });

    it("clicking 'ok' in modal closes and calls onChangeHandler", () => {
        const onChangeHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            onChange: onChangeHandler,
        });
        wrapper.find("div.inline-block.tagtext")
            .first()
            .simulate("click", { target: { innerText: originalTags[0].name}, ctrlKey: true});
        wrapper.find("button.btn.btn-success").simulate("click");
        expect(wrapper.find(TagsInput).state().showModal).toBe(false);
        expect(onChangeHandler).toBeCalled();
    });

    it("clicking 'cancel' in modal closes and does not call onChangeHandler", () => {
        const onChangeHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            onChange: onChangeHandler,
        });
        wrapper.find("div.inline-block.tagtext")
            .first()
            .simulate("click", { target: { innerText: originalTags[0].name}, ctrlKey: true});
        wrapper.find("button.btn.btn-secondary").simulate("click");
        expect(wrapper.find(TagsInput).state().showModal).toBe(false);
        expect(onChangeHandler).not.toBeCalled();
    });

    it("clicking tag calls onTagClick handler", () => {
        const onChangeHandler = jest.fn();
        const onTagClickHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            onChange: onChangeHandler,
            onTagClick: onTagClickHandler,
        });
        wrapper.find("div.inline-block.tagtext")
            .first()
            .simulate("click", { target: { innerText: originalTags[0].name}});
        expect(onTagClickHandler).toBeCalledWith(originalTags[0]);
    });

    it("clicking tag does not call onTagClick handler when not specified", () => {
        const onChangeHandler = jest.fn();
        const onTagClickHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            onChange: onChangeHandler,
            onTagClick: null,
        });
        wrapper.find("div.inline-block.tagtext")
            .first()
            .simulate("click", { target: { innerText: originalTags[0].name}});
        expect(onTagClickHandler).not.toBeCalled();
    });

    it("clicking tag does not open modal or call onTagShiftClick handler", () => {
        const onChangeHandler = jest.fn();
        const onTagClickHandler = jest.fn();
        const onTagShiftClickHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            onChange: onChangeHandler,
            onTagShiftClick: onTagShiftClickHandler,
            onTagClick: onTagClickHandler,
        });
        wrapper.find("div.inline-block.tagtext")
            .first()
            .simulate("click", { target: { innerText: originalTags[0].name}});
        expect(onTagClickHandler).toBeCalledWith(originalTags[0]);
        // Does not show modal
        expect(wrapper.find(TagsInput).state().showModal).toBe(false);
        // Does not call onTagShiftClick
        expect(onTagShiftClickHandler).not.toBeCalled();
    });

    it("shift clicking tag calls onTagShiftClick handler", () => {
        const onChangeHandler = jest.fn();
        const onTagShiftClickHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            onChange: onChangeHandler,
            onTagShiftClick: onTagShiftClickHandler,
        });
        wrapper.find("div.inline-block.tagtext")
            .first()
            .simulate("click", { target: { innerText: originalTags[0].name}, shiftKey: true});
        expect(onTagShiftClickHandler).toBeCalledWith(originalTags[0]);
    });

    it("shift clicking tag does not open modal or call onTagClick handler", () => {
        const onChangeHandler = jest.fn();
        const onTagClickHandler = jest.fn();
        const onTagShiftClickHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            onChange: onChangeHandler,
            onTagShiftClick: onTagShiftClickHandler,
            onTagClick: onTagClickHandler,
        });
        wrapper.find("div.inline-block.tagtext")
            .first()
            .simulate("click", { target: { innerText: originalTags[0].name}, shiftKey: true});
        expect(onTagShiftClickHandler).toBeCalledWith(originalTags[0]);
        // Does not show modal
        expect(wrapper.find(TagsInput).state().showModal).toBe(false);
        // Does not call onTagClick
        expect(onTagClickHandler).not.toBeCalled();
    });

    it("shift clicking tag does not call onTagShiftClick handler when not specified", () => {
        const onChangeHandler = jest.fn();
        const onTagClickHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            onChange: onChangeHandler,
            onTagShiftClick: null,
        });
        wrapper.find("div.inline-block.tagtext")
            .first()
            .simulate("click", { target: { innerText: originalTags[0].name}, shiftKey: true});
        expect(onTagClickHandler).not.toBeCalled();
    });
});
