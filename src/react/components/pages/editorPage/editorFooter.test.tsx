import { mount, ReactWrapper } from "enzyme";
import React from "react";
import EditorFooter, { IEditorFooterProps, IEditorFooterState } from "./editorFooter";
import MockFactory from "../../../../common/mockFactory";

describe("Footer Component", () => {

    const originalTags = MockFactory.createTestTags();

    function createComponent(props: IEditorFooterProps): ReactWrapper<IEditorFooterProps, IEditorFooterState> {
        return mount(
            <EditorFooter {...props} />,
        );
    }

    it("tags are initialized correctly", () => {
        const wrapper = createComponent({
            tags: originalTags,
            lockedTags: [],
        });
        const stateTags = wrapper.state().tags;
        expect(stateTags).toEqual(originalTags);
    });

    it("tags are empty", () => {
        const wrapper = createComponent({
            tags: [],
            lockedTags: [],
        });
        const stateTags = wrapper.state()["tags"];
        expect(stateTags).toEqual([]);
    });

    it("create a new tag from text box", () => {
        const onChangeHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            lockedTags: [],
            onTagsChanged: onChangeHandler,
        });
        const newTagName = "My new tag";
        wrapper.find("input").simulate("change", { target: { value: newTagName } });
        wrapper.find("input").simulate("keyDown", { keyCode: 13 });
        expect(onChangeHandler).toBeCalled();

        const tags = wrapper.state().tags;
        expect(tags).toHaveLength(originalTags.length + 1);
        expect(tags[tags.length - 1].name).toEqual(newTagName);
    });

    it("create a new tag when no tags exist", () => {
        const onChangeHandler = jest.fn();
        const wrapper = createComponent({
            tags: null,
            lockedTags: [],
            onTagsChanged: onChangeHandler,
        });
        const newTagName = "My new tag";
        wrapper.find("input").simulate("change", { target: { value: newTagName } });
        wrapper.find("input").simulate("keyDown", { keyCode: 13 });
        expect(onChangeHandler).toBeCalled();

        const tags = wrapper.state().tags;
        expect(tags).toHaveLength(1);
        expect(tags[0].name).toEqual(newTagName);
    });

    it("remove a tag", () => {
        const onChangeHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            lockedTags: [],
            onTagsChanged: onChangeHandler,
        });
        expect(wrapper.state().tags).toHaveLength(originalTags.length);
        wrapper.find("a.ReactTags__remove")
            .last().simulate("click");
        expect(onChangeHandler).toBeCalled();
        const tags = wrapper.state().tags;
        expect(tags).toHaveLength(originalTags.length - 1);
        expect(tags[0].name).toEqual(originalTags[0].name);
        expect(tags[0].color).toEqual(originalTags[0].color);
    });

    it("clicking 'ok' in modal closes and calls onChangeHandler", () => {
        const onChangeHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            lockedTags: [],
            onTagsChanged: onChangeHandler,
        });
        wrapper.find("div.tag")
            .first()
            .simulate("click", { target: { innerText: originalTags[0].name }, shiftKey: true});
        wrapper.find("button.btn.btn-success").simulate("click");
        expect(onChangeHandler).toBeCalled();
    });

    it("clicking 'cancel' in modal closes and does not call onChangeHandler", () => {
        const onChangeHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            lockedTags: [],
            onTagsChanged: onChangeHandler,
        });
        wrapper.find("div.tag")
            .first()
            .simulate("click", { target: { innerText: originalTags[0].name }, shiftKey: true});
        wrapper.find("button.btn.btn-secondary").simulate("click");

        expect(onChangeHandler).not.toBeCalled();
    });

    it("clicking tag calls onTagClickHandler ", () => {
        const onChangeHandler = jest.fn();
        const onTagClickHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            lockedTags: [],
            onTagsChanged: onChangeHandler,
            onTagClicked: onTagClickHandler,
        });
        wrapper.find("div.tag")
            .first()
            .simulate("click", { target: { innerText: originalTags[0].name }});

        expect(onTagClickHandler).toBeCalledWith(originalTags[0]);
    });

    it("clicking tag with ctrl does not call onTagClickHandler ", () => {
        const onChangeHandler = jest.fn();
        const onTagClickHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            lockedTags: [],
            onTagsChanged: onChangeHandler,
            onTagClicked: onTagClickHandler,
        });
        wrapper.find("div.tag")
            .first()
            .simulate("click", { target: { innerText: originalTags[0].name }, shiftKey: true});

        expect(onTagClickHandler).not.toBeCalled();
    });

    it("componentDidUpdate check", async () => {
        const onChangeHandler = jest.fn();
        const onTagClickHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            lockedTags: [],
            onTagsChanged: onChangeHandler,
            onTagClicked: onTagClickHandler,
        });

        wrapper.setProps({tags: [...originalTags, {color: "#808000", name: "NEWTAG"}]});

        await MockFactory.flushUi();
        wrapper.update();

        const tagChild = wrapper.find("div.tag");

        expect(tagChild.length).toEqual(originalTags.length + 1);
        expect(tagChild.last().text()).toMatch("NEWTAG");
    });
});
