import { mount } from "enzyme";
import React from "react";
import MockFactory from "../../../../common/mockFactory";
import { KeyCodes } from "../../../../common/utils";
import EditorTagsInput from "./editorTagsInput";
import { ITagsInputProps } from "vott-react";

// tslint:disable-next-line:no-var-requires
const TagColors = require("vott-react/dist/lib/components/common/tagColors");

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
