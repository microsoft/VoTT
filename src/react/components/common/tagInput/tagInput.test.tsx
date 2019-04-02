import React from "react";
import { ReactWrapper, mount } from "enzyme";
import { TagInput, ITagInputProps, ITagInputState } from "./tagInput";
import MockFactory from "../../../../common/mockFactory";
import { ITag } from "../../../../models/applicationState";
import TagInputItem, { ITagInputItemProps } from "./tagInputItem";

describe("Tag Input Component", () => {

    function createComponent(props?: ITagInputProps):
        ReactWrapper<ITagInputProps, ITagInputState> {
        return mount(<TagInput {...(props || createProps())} />);
    }

    function createProps(tags?: ITag[], onChange?): ITagInputProps {
        return {
            tags: tags || MockFactory.createTestTags(),
            lockedTags: [],
            selectedRegions: [MockFactory.createTestRegion()],
            onChange: onChange || jest.fn(),
            onLockedTagsChange: jest.fn(),
            onTagClick: jest.fn(),
            onCtrlTagClick: jest.fn(),
        };
    }

    it("Renders correctly", () => {
        const tags = MockFactory.createTestTags();
        const wrapper = createComponent(createProps(tags));
        expect(wrapper.exists(".tag-input-toolbar")).toBe(true);
        expect(wrapper.find(".tag-item-block").length).toBe(tags.length);
    });

    it("Calls onClick handler when clicking color box", () => {
        const props: ITagInputProps = createProps();
        const wrapper = createComponent(props);
        wrapper.find(".tag-color").first().simulate("click");
        expect(props.onTagClick).toBeCalledWith(props.tags[0]);
        expect(wrapper.state().clickedColor).toBe(true);
        expect(props.onCtrlTagClick).not.toBeCalled();
    });

    it("Calls onClick handler when clicking text", () => {
        const props: ITagInputProps = createProps();
        const wrapper = createComponent(props);
        wrapper.find(".tag-name-text").first().simulate("click");
        expect(props.onTagClick).toBeCalledWith(props.tags[0]);
        expect(props.onCtrlTagClick).not.toBeCalled();
    });

    it("Calls onCtrlClick handler when clicking color box", () => {
        const props: ITagInputProps = createProps();
        const wrapper = createComponent(props);
        wrapper.find(".tag-color").first().simulate("click", { ctrlKey: true });
        expect(props.onCtrlTagClick).toBeCalledWith(props.tags[0]);
        expect(wrapper.state().clickedColor).toBe(true);
        expect(props.onTagClick).not.toBeCalled();
    });

    it("Calls onClick handler when clicking text", () => {
        const props: ITagInputProps = createProps();
        const wrapper = createComponent(props);
        wrapper.find(".tag-name-text").first().simulate("click", { ctrlKey: true });
        expect(props.onCtrlTagClick).toBeCalledWith(props.tags[0]);
        expect(props.onTagClick).not.toBeCalled();
    });

    it("Adds a tag", () => {
        const props: ITagInputProps = {
            ...createProps(),
            showTagInputBox: true,
        };
        const wrapper = createComponent(props);
        const newTagName = "New Tag";
        wrapper.find(".tag-input-box").simulate("keydown", { key: "Enter", target: { value: newTagName } } );
        expect(props.onChange).toBeCalledWith([
            ...props.tags,
            {
                name: newTagName,
                color: expect.any(String),
            },
        ]);
    });

    describe("Toolbar", () => {
        it("Tag input box can be shown on click of toolbar button", () => {
            const wrapper = createComponent();
            expect(wrapper.exists(".tag-input-box")).toBe(false);
            expect(wrapper.state().addTags).toBeFalsy();
            wrapper.find("div.tag-input-toolbar-item.plus").simulate("click");
            expect(wrapper.exists(".tag-input-box")).toBe(true);
            expect(wrapper.state().addTags).toBe(true);
        });

        it("Tag search box can be shown on click of search button", () => {
            const wrapper = createComponent();
            expect(wrapper.exists(".search-input")).toBe(false);
            expect(wrapper.state().searchTags).toBeFalsy();
            wrapper.find("div.tag-input-toolbar-item.search").simulate("click");
            expect(wrapper.exists(".search-input")).toBe(true);
            expect(wrapper.state().searchTags).toBe(true);
        });

        it("Tag can be locked from toolbar", () => {
            const tags = MockFactory.createTestTags();
            const props = createProps(tags);
            const wrapper = createComponent(props);
            wrapper.find("div.tag-name-container").first().simulate("click");
            wrapper.find("div.tag-input-toolbar-item.lock").simulate("click");
            expect(props.onLockedTagsChange).toBeCalledWith([tags[0].name]);
        });

        it("Tag can be edited from toolbar", () => {
            const tags = MockFactory.createTestTags();
            const props = createProps(tags);
            const wrapper = createComponent(props);
            wrapper.find("div.tag-name-container").first().simulate("click");
            wrapper.find("div.tag-input-toolbar-item.edit").simulate("click");
            expect(wrapper.state().editingTag).toEqual(tags[0]);
            expect(wrapper.exists("input.tag-name-editor")).toBe(true);
        });

        it("Tag can be moved up from toolbar", () => {
            const tags = MockFactory.createTestTags();
            const lastTag = tags[tags.length - 1];
            const secondToLastTag = tags[tags.length - 2];
            const props = createProps(tags);
            const wrapper = createComponent(props);
            wrapper.find("div.tag-name-container").last().simulate("click");
            wrapper.find("div.tag-input-toolbar-item.up").simulate("click");
            const stateTags = wrapper.state().tags;
            expect(stateTags[stateTags.length - 2]).toEqual(lastTag);
            expect(stateTags[stateTags.length - 1]).toEqual(secondToLastTag);
        });

        it("Tag can be moved down from toolbar", () => {
            const tags = MockFactory.createTestTags();
            const firstTag = tags[0];
            const secondTag = tags[1];
            const props = createProps(tags);
            const wrapper = createComponent(props);
            wrapper.find("div.tag-name-container").first().simulate("click");
            wrapper.find("div.tag-input-toolbar-item.down").simulate("click");
            const stateTags = wrapper.state().tags;
            expect(stateTags[1]).toEqual(firstTag);
            expect(stateTags[0]).toEqual(secondTag);
        });

        it("Tag can be deleted from toolbar", () => {
            const tags = MockFactory.createTestTags();
            const firstTag = tags[0];
            const props = createProps(tags);
            const wrapper = createComponent(props);
            wrapper.find("div.tag-name-container").first().simulate("click");
            wrapper.find("div.tag-input-toolbar-item.delete").simulate("click");
            const stateTags = wrapper.state().tags;
            expect(stateTags.length).toEqual(tags.length - 1);
            expect(stateTags[0]).not.toEqual(firstTag);
        });
    });

    it("Does not try to add empty tag", () => {
        const props: ITagInputProps = {
            ...createProps(),
            showTagInputBox: true,
        };
        const wrapper = createComponent(props);
        wrapper.find(".tag-input-box").simulate("keydown", { key: "Enter", target: { value: "" } });
        expect(props.onChange).not.toBeCalled();
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
        wrapper.find("input.tag-name-editor").simulate("keydown", { key: "Enter", target: { value: newTagName } });
        const expectedTags = tags.map((t) => {
            return (t.name === firstTag.name) ? {
                name: newTagName,
                color: firstTag.color,
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

    it("set's applied tags when selected regions are available", () => {
        const tags = MockFactory.createTestTags();
        const onChange = jest.fn();
        const props = createProps(tags, onChange);
        const wrapper = createComponent(props);

        const selectedRegion = MockFactory.createTestRegion();
        selectedRegion.tags = [tags[0].name, tags[1].name];

        wrapper.setProps({
            selectedRegions: [selectedRegion],
        });

        const selectedTags = wrapper
            .findWhere((el: ReactWrapper<ITagInputItemProps>) => {
                return el.type() === TagInputItem && el.props().appliedToSelectedRegions;
            });

        expect(wrapper.state().selectedTag).toBeNull();
        expect(selectedTags).toHaveLength(2);
        expect(selectedTags.at(0).props().tag).toEqual(tags[0]);
        expect(selectedTags.at(1).props().tag).toEqual(tags[1]);
    });
});
