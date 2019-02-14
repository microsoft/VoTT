import { mount } from "enzyme";
import React from "react";
import MockFactory from "../../../../common/mockFactory";
import { KeyCodes } from "../../../../common/utils";
import EditorTagsInput from "./editorTagsInput";
import { ITagsInputProps } from "vott-react";

// tslint:disable-next-line:no-var-requires
const TagColors = require("vott-react/dist/lib/components/common/tagColors");
const ColorCodes = [];

for (const key in TagColors) {
    if (key) {
        for (const color in TagColors[key]) {
            if (color) {
                ColorCodes.push(TagColors[key][color]);
            }
        }
    }
}

describe("Tags Input Component", () => {

    const originalTags = MockFactory.createTestTags(15);

    function createComponent(props: ITagsInputProps) {
        return mount(
            // Listing props one by one because of 'ref' typescript error.
            // Example: https://github.com/ant-design/ant-design/issues/10405
            <EditorTagsInput
                tags={props.tags}
                onChange={props.onChange}
                placeHolder={props.placeHolder}
                delimiters={props.delimiters}
                onTagClick={props.onTagClick}
                onCtrlTagClick={props.onCtrlTagClick}
                onShiftTagClick={props.onShiftTagClick}
                onCtrlShiftTagClick={props.onCtrlShiftTagClick}
            />,
        );
    }

    it("tags are initialized correctly", () => {
        const onChangeHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            onChange: onChangeHandler,
        });
        const stateTags = wrapper.find(EditorTagsInput).state().tags;
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
        expect(wrapper.find("div.tag-color-box")).toHaveLength(originalTags.length);
    });

    it("one text input field is available", () => {
        const onChangeHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            onChange: onChangeHandler,
        });
        expect(wrapper.find("input")).toHaveLength(1);
    });

    it("creates a new tag from text box - enter key", () => {
        const onChangeHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            onChange: onChangeHandler,
        });
        const newTagName = "My new tag";
        wrapper.find("input").simulate("change", {target: {value: newTagName}});
        wrapper.find("input").simulate("keyDown", {keyCode: KeyCodes.enter});
        expect(onChangeHandler).toBeCalled();
        expect(wrapper.find(EditorTagsInput).state().tags).toHaveLength(originalTags.length + 1);
        const newTagIndex = originalTags.length;
        expect(wrapper.find(EditorTagsInput).state().tags[newTagIndex].id).toEqual(newTagName);
        expect(ColorCodes).toContain(wrapper.find(EditorTagsInput).state().tags[newTagIndex].color);
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
        expect(wrapper.find(EditorTagsInput).state().tags).toHaveLength(originalTags.length + 1);
        const newTagIndex = originalTags.length;
        expect(wrapper.find(EditorTagsInput).state().tags[newTagIndex].id).toEqual(newTagName);
        expect(ColorCodes).toContain(wrapper.find(EditorTagsInput).state().tags[newTagIndex].color);
    });

    it("remove a tag", () => {
        const onChangeHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            onChange: onChangeHandler,
        });
        expect(wrapper.find(EditorTagsInput).state().tags).toHaveLength(originalTags.length);
        wrapper.find("a.ReactTags__remove")
            .last().simulate("click");
        expect(onChangeHandler).toBeCalled();
        expect(wrapper.find(EditorTagsInput).state().tags).toHaveLength(originalTags.length - 1);
        expect(wrapper.find(EditorTagsInput).state().tags[0].id).toEqual(originalTags[0].name);
        expect(wrapper.find(EditorTagsInput).state().tags[0].color).toEqual(originalTags[0].color);
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
        expect(wrapper.find(EditorTagsInput).state().tags).toHaveLength(originalTags.length);
    });

    it("ctrl clicking tag does not call onTagClick or OnTagShiftClick", () => {
        const onChangeHandler = jest.fn();
        const onTagClickHandler = jest.fn();
        const onTagShiftClickHandler = jest.fn();
        const onTagCtrlClickHandler = jest.fn();

        const wrapper = createComponent({
            tags: originalTags,
            onChange: onChangeHandler,
            onShiftTagClick: onTagShiftClickHandler,
            onTagClick: onTagClickHandler,
            onCtrlTagClick: onTagCtrlClickHandler,
        });
        wrapper.find("div.tag")
            .first()
            .simulate("click", { target: { innerText: originalTags[0].name}, ctrlKey: true});
        expect(onTagCtrlClickHandler).toBeCalled();
        // Does not Call onTagShiftClick
        expect(onTagShiftClickHandler).not.toBeCalled();
        // Does not call onTagClick
        expect(onTagClickHandler).not.toBeCalled();
    });

    it("clicking tag calls onTagClick handler", () => {
        const onChangeHandler = jest.fn();
        const onTagClickHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            onChange: onChangeHandler,
            onTagClick: onTagClickHandler,
        });
        wrapper.find("div.tag")
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
        wrapper.find("div.tag")
            .first()
            .simulate("click", { target: { innerText: originalTags[0].name}});
        expect(onTagClickHandler).not.toBeCalled();
    });

    it("clicking tag does not call onTagShiftClick handler", () => {
        const onChangeHandler = jest.fn();
        const onTagClickHandler = jest.fn();
        const onTagShiftClickHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            onChange: onChangeHandler,
            onShiftTagClick: onTagShiftClickHandler,
            onTagClick: onTagClickHandler,
        });
        wrapper.find("div.tag")
            .first()
            .simulate("click", { target: { innerText: originalTags[0].name}});
        expect(onTagClickHandler).toBeCalledWith(originalTags[0]);
        // Does not call onTagShiftClick
        expect(onTagShiftClickHandler).not.toBeCalled();
    });

    it("shift clicking tag calls onTagShiftClick handler", () => {
        const onChangeHandler = jest.fn();
        const onTagShiftClickHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            onChange: onChangeHandler,
            onShiftTagClick: onTagShiftClickHandler,
        });
        wrapper.find("div.tag")
            .first()
            .simulate("click", { target: { innerText: originalTags[0].name}, shiftKey: true});
        expect(onTagShiftClickHandler).toBeCalledWith(originalTags[0]);
    });

    it("shift clicking tag does not call onTagClick handler", () => {
        const onChangeHandler = jest.fn();
        const onTagClickHandler = jest.fn();
        const onTagShiftClickHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            onChange: onChangeHandler,
            onShiftTagClick: onTagShiftClickHandler,
            onTagClick: onTagClickHandler,
        });
        wrapper.find("div.tag")
            .first()
            .simulate("click", { target: { innerText: originalTags[0].name}, shiftKey: true});
        expect(onTagShiftClickHandler).toBeCalledWith(originalTags[0]);
        // Does not call onTagClick
        expect(onTagClickHandler).not.toBeCalled();
    });

    it("shift clicking tag does not call onTagShiftClick handler when not specified", () => {
        const onChangeHandler = jest.fn();
        const onTagClickHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            onChange: onChangeHandler,
            onShiftTagClick: null,
        });
        wrapper.find("div.tag")
            .first()
            .simulate("click", { target: { innerText: originalTags[0].name}, shiftKey: true});
        expect(onTagClickHandler).not.toBeCalled();
    });

    it("displays correct initial index in span", () => {
        const wrapper = createComponent({
            tags: originalTags,
            onChange: null,
            onShiftTagClick: null,
        });
        expect(wrapper.find(".tag-span-index")).toHaveLength(10);
        const tagSpans = wrapper.find(".tag-span-index");
        for (let i = 0; i < 9; i++) {
            const tag = tagSpans.get(i);
            expect(tag.props.children[0]).toEqual(`[${i + 1}]  `);
        }
        const tenthTag = tagSpans.get(9);
        expect(tenthTag.props.children[0]).toEqual(`[0]  `);
    });

    it("does not display indices when specified not to", () => {
        const wrapper = createComponent({
            tags: originalTags,
            onChange: null,
            onShiftTagClick: null,
        });
        expect(wrapper.find(".tag-span")).toHaveLength(15);
        expect(wrapper.find(".tag-span-index")).toHaveLength(10);
    });

    it("updates indices in tags after removing first", (done) => {
        const onChangeHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            onChange: onChangeHandler,
        });
        expect(wrapper.find(EditorTagsInput).state().tags).toHaveLength(originalTags.length);
        expect(wrapper.find(".tag-span-index")).toHaveLength(10);

        wrapper.find("a.ReactTags__remove")
            .first().simulate("click");
        expect(onChangeHandler).toBeCalled();
        expect(wrapper.find(EditorTagsInput).state().tags).toHaveLength(originalTags.length - 1);
        setTimeout(() => {
            wrapper.update();
            expect(wrapper.find(".tag-span-index")).toHaveLength(10);
            const tagSpans = wrapper.find(".tag-span-index");
            for (let i = 0; i < 9; i++) {
                const tag = tagSpans.get(i);
                expect(tag.props.children[0]).toEqual(`[${i + 1}]  `);
            }
            const tenthTag = tagSpans.get(9);
            expect(tenthTag.props.children[0]).toEqual(`[0]  `);
            done();
        }, 1);
    });
});
