import React from "react";
import { ReactWrapper, mount } from "enzyme";
import { VerticalTagInput, IVerticalTagInputProps, IVerticalTagInputState } from "./verticalTagInput";
import MockFactory from "../../../../common/mockFactory";
import { ITag } from "../../../../models/applicationState";
// tslint:disable-next-line:no-var-requires
const tagColors = require("../tagColors.json");

import { GithubPicker } from "react-color";

describe("Vertical Tag Input Component", () => {

    function createComponent(props?: IVerticalTagInputProps):
            ReactWrapper<IVerticalTagInputProps, IVerticalTagInputState> {
        return mount(<VerticalTagInput {...(props || createProps())}/>);
    }

    function createProps(tags?: ITag[], onChange?): IVerticalTagInputProps {
        return {
            tags: tags || MockFactory.createTestTags(),
            lockedTags: [],
            onChange: onChange || jest.fn(),
            onLockedTagsChange: jest.fn(),
            onTagNameChange: jest.fn(),
            onTagClick: jest.fn(),
            onCtrlTagClick: jest.fn(),
        };
    }

    it("Renders correctly", () => {
        const tags = MockFactory.createTestTags();
        const wrapper = createComponent(createProps(tags));
        expect(wrapper.exists(".tag-input-box")).toBe(true);
        expect(wrapper.exists(".tag-input-toolbar")).toBe(true);
        expect(wrapper.find(".tag-item-block").length).toBe(tags.length);
    });

    it("Adds a tag", () => {
        const tags = MockFactory.createTestTags();
        const onChange = jest.fn();
        const props = createProps(tags, onChange);
        const wrapper = createComponent(props);
        const newTagName = "New Tag";
        wrapper.find(".tag-input-box").simulate("keypress", {key: "Enter", target: {value: newTagName}});
        expect(onChange).toBeCalled();
    });

    it("Does not try to add empty tag", () => {
        const tags = MockFactory.createTestTags();
        const onChange = jest.fn();
        const props = createProps(tags, onChange);
        const wrapper = createComponent(props);
        wrapper.find(".tag-input-box").simulate("keypress", {key: "Enter", target: {value: ""}});
        expect(onChange).not.toBeCalled();
    });

    it("Selects a tag", () => {
        const tags = MockFactory.createTestTags();
        const onChange = jest.fn();
        const props = createProps(tags, onChange);
        const wrapper = createComponent(props);
        expect(wrapper.state().selectedTag).toBeNull();
        wrapper.find(".tag-content").first().simulate("click");
        expect(wrapper.state().selectedTag).toEqual(tags[0]);
    });

    it("Locks a tag", () => {
        const tags = MockFactory.createTestTags();
        const onChange = jest.fn();
        const onLockedTagsChange = jest.fn();
        const props = {
            ...createProps(tags, onChange),
            onLockedTagsChange,
        };
        const wrapper = createComponent(props);
        wrapper.find(".tag-content").first().simulate("click");
        wrapper.find("i.tag-input-toolbar-icon.fas.fa-lock").simulate("click");
        expect(onLockedTagsChange).toBeCalledWith([tags[0].name]);
    });

    it("Removes a tag", () => {
        const tags = MockFactory.createTestTags();
        const onChange = jest.fn();
        const props = createProps(tags, onChange);
        const wrapper = createComponent(props);
        const firstTagName = tags[0].name;
        wrapper.find(".tag-content").first().simulate("click");
        wrapper.find("i.tag-input-toolbar-icon.fas.fa-trash").simulate("click");
        const expectedTags = tags.filter((t) => t.name !== firstTagName);
        expect(wrapper.state().tags).toEqual(expectedTags);
        expect(onChange).toBeCalledWith(expectedTags);
    });

    it("Edits a tag name", () => {
        const tags = MockFactory.createTestTags();
        const onChange = jest.fn();
        const onTagNameChange = jest.fn();
        const props = {
            ...createProps(tags, onChange),
            onTagNameChange,
        };
        const wrapper = createComponent(props);
        const newTagName = "new tag name";
        const firstTag = tags[0];
        wrapper.find(".tag-content").first().simulate("click");
        wrapper.find("i.tag-input-toolbar-icon.fas.fa-edit").simulate("click");
        wrapper.find("input.tag-name-editor").simulate("keypress", {key: "Enter", target: {value: newTagName}});
        const expectedTags = tags.map((t) => {
            return (t.name === firstTag.name) ? {
                name: newTagName,
                color: firstTag.color,
            } : t;
        });
        expect(wrapper.state().tags).toEqual(expectedTags);
        expect(onChange).toBeCalledWith(expectedTags);
    });

    it("Edits a tag color", () => {
        const tags = MockFactory.createTestTags();
        const onChange = jest.fn();
        const props = createProps(tags, onChange);
        const wrapper = createComponent(props);
        const firstTag = tags[0];
        wrapper.find(".tag-color").first().simulate("click");
        wrapper.find("i.tag-input-toolbar-icon.fas.fa-edit").simulate("click");
        const colorPicker = wrapper.find(GithubPicker);
        const color = {hex: tagColors[3]};
        (colorPicker.prop("onChangeComplete") as any)(color);
        const expectedTags = tags.map((t) => {
            return (t.name === firstTag.name) ? {
                name: firstTag.name,
                color: color.hex,
            } : t;
        });
        expect(wrapper.state().tags).toEqual(expectedTags);
        expect(onChange).toBeCalledWith(expectedTags);
    });

    it("Reorders a tag", () => {
        const tags = MockFactory.createTestTags();
        const onChange = jest.fn();
        const props = createProps(tags, onChange);
        const wrapper = createComponent(props);
        const firstTag = tags[0];
        wrapper.find(".tag-content").first().simulate("click");
        wrapper.find("i.tag-input-toolbar-icon.fas.fa-arrow-circle-down").simulate("click");
        expect(wrapper.state().tags.indexOf(firstTag)).toEqual(1);
        wrapper.find("i.tag-input-toolbar-icon.fas.fa-arrow-circle-down").simulate("click");
        expect(wrapper.state().tags.indexOf(firstTag)).toEqual(2);
        wrapper.find("i.tag-input-toolbar-icon.fas.fa-arrow-circle-up").simulate("click");
        expect(wrapper.state().tags.indexOf(firstTag)).toEqual(1);
        wrapper.find("i.tag-input-toolbar-icon.fas.fa-arrow-circle-up").simulate("click");
        expect(wrapper.state().tags.indexOf(firstTag)).toEqual(0);
    });
});
