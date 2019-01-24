import { mount } from "enzyme";
import React from "react";
import MockFactory from "../../../../common/mockFactory";
import { KeyCodes } from "../../../../common/utils";
import EditorTagsInput from "./editorTagsInput";
import { ITagsInputProps } from "vott-react";

// tslint:disable-next-line:no-var-requires
const TagColors = require("../../common/tagsInput/tagColors.json");

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
        expect(wrapper.find(EditorTagsInput).state().tags).toHaveLength(originalTags.length + 1);
        const newTagIndex = originalTags.length;
        expect(wrapper.find(EditorTagsInput).state().tags[newTagIndex].id).toEqual(newTagName);
        expect(TagColors).toContain(wrapper.find(EditorTagsInput).state().tags[newTagIndex].color);
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
        expect(TagColors).toContain(wrapper.find(EditorTagsInput).state().tags[newTagIndex].color);
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

    it("ctrl clicking tag opens editor modal", () => {
        const onChangeHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            onChange: onChangeHandler,
        });
        expect(wrapper.find(EditorTagsInput).state().showModal).toBe(false);
        wrapper.find("div.tag")
            .first()
            .simulate("click", { target: { innerText: originalTags[0].name}, ctrlKey: true});
        expect(wrapper.find(EditorTagsInput).state().showModal).toBe(true);
    });

    it("ctrl clicking tag sets selected tag", () => {
        const onChangeHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            onChange: onChangeHandler,
        });
        wrapper.find("div.tag")
            .first()
            .simulate("click", { target: { innerText: originalTags[0].name}, ctrlKey: true});
        expect(wrapper.find(EditorTagsInput).state().selectedTag.id).toEqual(originalTags[0].name);
        expect(wrapper.find(EditorTagsInput).state().selectedTag.color).toEqual(originalTags[0].color);
    });

    it("ctrl clicking tag does not call onTagClick or onShiftTagClick", () => {
        const onChangeHandler = jest.fn();
        const onTagClickHandler = jest.fn();
        const onShiftTagClickHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            onChange: onChangeHandler,
            onShiftTagClick: onShiftTagClickHandler,
            onTagClick: onTagClickHandler,
        });
        wrapper.find("div.tag")
            .first()
            .simulate("click", { target: { innerText: originalTags[0].name}, ctrlKey: true});
        // Shows modal
        expect(wrapper.find(EditorTagsInput).state().showModal).toBe(true);
        // Does not Call onShiftTagClick
        expect(onShiftTagClickHandler).not.toBeCalled();
        // Does not call onTagClick
        expect(onTagClickHandler).not.toBeCalled();
    });

    it("clicking 'ok' in modal closes and calls onChangeHandler", () => {
        const onChangeHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            onChange: onChangeHandler,
        });
        wrapper.find("div.tag")
            .first()
            .simulate("click", { target: { innerText: originalTags[0].name}, ctrlKey: true});
        wrapper.find("button.btn.btn-success").simulate("click");
        expect(wrapper.find(EditorTagsInput).state().showModal).toBe(false);
        expect(onChangeHandler).toBeCalled();
    });

    it("clicking 'cancel' in modal closes and does not call onChangeHandler", () => {
        const onChangeHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            onChange: onChangeHandler,
        });
        wrapper.find("div.tag")
            .first()
            .simulate("click", { target: { innerText: originalTags[0].name}, ctrlKey: true});
        wrapper.find("button.btn.btn-secondary").simulate("click");
        expect(wrapper.find(EditorTagsInput).state().showModal).toBe(false);
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

    it("clicking tag does not open modal or call onShiftTagClick handler", () => {
        const onChangeHandler = jest.fn();
        const onTagClickHandler = jest.fn();
        const onShiftTagClickHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            onChange: onChangeHandler,
            onShiftTagClick: onShiftTagClickHandler,
            onTagClick: onTagClickHandler,
        });
        wrapper.find("div.tag")
            .first()
            .simulate("click", { target: { innerText: originalTags[0].name}});
        expect(onTagClickHandler).toBeCalledWith(originalTags[0]);
        // Does not show modal
        expect(wrapper.find(EditorTagsInput).state().showModal).toBe(false);
        // Does not call onShiftTagClick
        expect(onShiftTagClickHandler).not.toBeCalled();
    });

    it("shift clicking tag calls onShiftTagClick handler", () => {
        const onChangeHandler = jest.fn();
        const onShiftTagClickHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            onChange: onChangeHandler,
            onShiftTagClick: onShiftTagClickHandler,
        });
        wrapper.find("div.tag")
            .first()
            .simulate("click", { target: { innerText: originalTags[0].name}, shiftKey: true});
        expect(onShiftTagClickHandler).toBeCalledWith(originalTags[0]);
    });

    it("shift clicking tag does not open modal or call onTagClick handler", () => {
        const onChangeHandler = jest.fn();
        const onTagClickHandler = jest.fn();
        const onShiftTagClickHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            onChange: onChangeHandler,
            onShiftTagClick: onShiftTagClickHandler,
            onTagClick: onTagClickHandler,
        });
        wrapper.find("div.tag")
            .first()
            .simulate("click", { target: { innerText: originalTags[0].name}, shiftKey: true});
        expect(onShiftTagClickHandler).toBeCalledWith(originalTags[0]);
        // Does not show modal
        expect(wrapper.find(EditorTagsInput).state().showModal).toBe(false);
        // Does not call onTagClick
        expect(onTagClickHandler).not.toBeCalled();
    });

    it("shift clicking tag does not call onShiftTagClick handler when not specified", () => {
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
        expect(wrapper.find(".tag-span-index")).toHaveLength(0);
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
