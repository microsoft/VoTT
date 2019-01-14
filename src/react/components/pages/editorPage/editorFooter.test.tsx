import { mount } from "enzyme";
import React from "react";
import EditorFooter, { IEditorFooterProps } from "./editorFooter";
import MockFactory from "../../../../common/mockFactory";
// tslint:disable-next-line:no-var-requires
const TagColors = require("../../common/tagsInput/tagColors.json");

describe("Footer Component", () => {
    let wrapper: any = null;
    let onChangeHandler: (value: any) => void;

    const originalTags = MockFactory.createTestTags();

    function createComponent(props: IEditorFooterProps) {
        return mount(
            <EditorFooter {...props} />,
        );
    }

    beforeEach(() => {
        onChangeHandler = jest.fn();
        const onClickHandler = jest.fn();

        wrapper = createComponent({
            tags: originalTags,
            displayHotKeys: true,
            onTagClicked: onClickHandler,
            onTagsChanged: onChangeHandler,
        });
    });

    it("tags are initialized correctly", () => {
        const stateTags = wrapper.state().tags;
        expect(stateTags).toEqual(originalTags);
    });

    it("tags are empty", () => {
        const onClickHandler = jest.fn();
        const emptyWrapper = mount(
            <EditorFooter
                tags={[]}
                displayHotKeys={true}
                onTagClicked={onClickHandler}
                onTagsChanged={onChangeHandler} />,
        );
        const stateTags = emptyWrapper.state()["tags"];
        expect(stateTags).toEqual([]);
    });

    it("create a new tag from text box", () => {
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
        wrapper.find("div.tag")
            .first()
            .simulate("click", { target: { innerText: originalTags[0].name }, ctrlKey: true});
        wrapper.find("button.btn.btn-success").simulate("click");
        expect(onChangeHandler).toBeCalled();
    });

    it("clicking 'cancel' in modal closes and does not call onChangeHandler", () => {
        wrapper.find("div.tag")
            .first()
            .simulate("click", { target: { innerText: originalTags[0].name }, ctrlKey: true});
        wrapper.find("button.btn.btn-secondary").simulate("click");

        expect(onChangeHandler).not.toBeCalled();
    });

});
