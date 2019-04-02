import React from "react";
import TagInputItem, { ITagInputItemProps } from "./tagInputItem";
import MockFactory from "../../../../common/mockFactory";
import { mount } from "enzyme";

describe("Tag Input Item", () => {

    function createProps(): ITagInputItemProps {
        return {
            tag: MockFactory.createTestTag(),
            index: 0,
            isBeingEdited: false,
            isLocked: false,
            isSelected: false,
            appliedToSelectedRegions: false,
            onClick: jest.fn(),
            onChange: jest.fn(),
        };
    }

    function createComponent(props?: ITagInputItemProps) {
        if (!props) {
            props = createProps();
        }
        return mount(
            <TagInputItem {...props} />,
        );
    }

    it("Renders correctly", () => {
        const wrapper = createComponent();
        expect(wrapper.exists(".tag-item-block"));
        expect(wrapper.exists(".tag-color"));
        expect(wrapper.exists(".tag-content"));
    });

    it("Clicking color calls onClickHandler", () => {
        const props = createProps();
        const wrapper = createComponent(props);
        wrapper.find(".tag-color").simulate("click");
        expect(props.onClick).toBeCalledWith(props.tag, {clickedColor: true});
    });

    it("Ctrl Clicking color calls onClickHandler", () => {
        const props = createProps();
        const wrapper = createComponent(props);
        wrapper.find(".tag-color").simulate("click", {ctrlKey: true});
        expect(props.onClick).toBeCalledWith(props.tag, {ctrlKey: true, clickedColor: true});
    });

    it("Alt Clicking color calls onClickHandler", () => {
        const props = createProps();
        const wrapper = createComponent(props);
        wrapper.find(".tag-color").simulate("click", {altKey: true});
        expect(props.onClick).toBeCalledWith(props.tag, {altKey: true, clickedColor: true});
    });

    it("Clicking text calls onClickHandler", () => {
        const props = createProps();
        const wrapper = createComponent(props);
        wrapper.find(".tag-content").simulate("click");
        expect(props.onClick).toBeCalledWith(props.tag, {});
    });

    it("Ctrl Clicking text calls onClickHandler", () => {
        const props = createProps();
        const wrapper = createComponent(props);
        wrapper.find(".tag-content").simulate("click", {ctrlKey: true});
        expect(props.onClick).toBeCalledWith(props.tag, {ctrlKey: true, altKey: undefined});
    });

    it("Alt Clicking text calls onClickHandler", () => {
        const props = createProps();
        const wrapper = createComponent(props);
        wrapper.find(".tag-content").simulate("click", {altKey: true});
        expect(props.onClick).toBeCalledWith(props.tag, {ctrlKey: undefined, altKey: true});
    });
});
