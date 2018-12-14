import React from "react";
import TagsInput from "./tagsInput";
import { mount } from "enzyme";
import { ITag } from "../../../../models/applicationState";
// tslint:disable-next-line:no-var-requires
const TagColors = require("./tagColors.json");

describe("Tags Input Component", () => {
    let wrapper: any = null;
    let onChangeHandler: (value: any) => void;

    const originalTags = [
        {
            name: "Tag1",
            color: "#800000",
        },
        {
            name: "Tag2",
            color: "#008080",
        },
    ];

    beforeEach(() => {
        onChangeHandler = jest.fn();
        wrapper = mount(
            <TagsInput
                tags={originalTags}
                onChange={onChangeHandler}/>,
        );
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
        expect(wrapper.find("div.inline-block.tag_color_box")).toHaveLength(2);
    });

    it("one text input field is available", () => {
        expect(wrapper.find("input")).toHaveLength(1);
    });

    it("create a new tag from text box - enter key", () => {
        const newTagName = "My new tag";
        wrapper.find("input").simulate("change", {target: {value: newTagName}});
        wrapper.find("input").simulate("keyDown", {keyCode: 13}); // enter
        expect(onChangeHandler).toBeCalled();
        expect(wrapper.state().tags).toHaveLength(3);
        expect(wrapper.state().tags[2].id).toEqual(newTagName);
        expect(TagColors).toContain(wrapper.state().tags[2].color);
    });

    it("create a new tag from text box - comma key", () => {
        const newTagName = "My new tag";
        wrapper.find("input").simulate("change", {target: {value: newTagName}});
        wrapper.find("input").simulate("keyDown", {keyCode: 188}); // comma
        expect(onChangeHandler).toBeCalled();
        expect(wrapper.state().tags).toHaveLength(3);
        expect(wrapper.state().tags[2].id).toEqual(newTagName);
        expect(TagColors).toContain(wrapper.state().tags[2].color);
    });

    it("remove a tag", () => {
        expect(wrapper.state().tags).toHaveLength(2);
        wrapper.find("a.ReactTags__remove")
            .last().simulate("click");
        expect(onChangeHandler).toBeCalled();
        expect(wrapper.state().tags).toHaveLength(1);
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
        wrapper.find("input").simulate("keyDown", {keyCode: 8}); // backspace
        expect(onChangeHandler).not.toBeCalled();
        expect(wrapper.state().tags).toHaveLength(originalTags.length);
    });
});
