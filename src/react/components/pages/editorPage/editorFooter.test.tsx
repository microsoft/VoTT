import { mount, ReactWrapper } from "enzyme";
import React from "react";
import EditorFooter, { IEditorFooterProps, IEditorFooterState } from "./editorFooter";
import MockFactory from "../../../../common/mockFactory";
// tslint:disable-next-line:no-var-requires
const TagColors = require("../../common/tagsInput/tagColors.json");

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
            displayHotKeys: true,
        });
        const stateTags = wrapper.state().tags;
        expect(stateTags).toEqual(originalTags);
    });

    it("tags are empty", () => {
        const wrapper = createComponent({
            tags: [],
            displayHotKeys: true,
        });
        const stateTags = wrapper.state()["tags"];
        expect(stateTags).toEqual([]);
    });

    it("create a new tag from text box", () => {
        const onChangeHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            displayHotKeys: true,
            onTagsChanged: onChangeHandler,
        });
        const newTagName = "My new tag";
        wrapper.find("input").simulate("change", { target: { value: newTagName } });
        wrapper.find("input").simulate("keyDown", { keyCode: 13 });
        expect(onChangeHandler).toBeCalled();

        const tags = wrapper.state().tags;
        expect(tags).toHaveLength(originalTags.length + 1);
        expect(tags[tags.length - 1].name).toEqual(newTagName);
        expect(TagColors).toContain(tags[tags.length - 1].color);
    });

    it("remove a tag", () => {
        const onChangeHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            displayHotKeys: true,
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
            displayHotKeys: true,
            onTagsChanged: onChangeHandler,
        });
        wrapper.find("div.tag")
            .first()
            .simulate("click", { target: { innerText: originalTags[0].name }, ctrlKey: true});
        wrapper.find("button.btn.btn-success").simulate("click");
        expect(onChangeHandler).toBeCalled();
    });

    it("clicking 'cancel' in modal closes and does not call onChangeHandler", () => {
        const onChangeHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            displayHotKeys: true,
            onTagsChanged: onChangeHandler,
        });
        wrapper.find("div.tag")
            .first()
            .simulate("click", { target: { innerText: originalTags[0].name }, ctrlKey: true});
        wrapper.find("button.btn.btn-secondary").simulate("click");

        expect(onChangeHandler).not.toBeCalled();
    });

    it("clicking tag without ctrl calls onTagClickHandler ", () => {
        const onChangeHandler = jest.fn();
        const onTagClickHandler = jest.fn();
        const wrapper = createComponent({
            tags: originalTags,
            displayHotKeys: true,
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
            displayHotKeys: true,
            onTagsChanged: onChangeHandler,
            onTagClicked: onTagClickHandler,
        });
        wrapper.find("div.tag")
            .first()
            .simulate("click", { target: { innerText: originalTags[0].name }, ctrlKey: true});

        expect(onTagClickHandler).not.toBeCalled();
    });

});
