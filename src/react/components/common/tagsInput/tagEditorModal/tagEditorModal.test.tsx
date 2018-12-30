import { mount } from "enzyme";
import React from "react";
import MockFactory from "../../../../../common/mockFactory";
import TagEditorModal, { ITagEditorModalProps } from "./tagEditorModal";
// tslint:disable-next-line:no-var-requires
const TagColors = require("../tagColors.json");

describe("Tag Editor Modal", () => {

    function createComponent(props: ITagEditorModalProps) {
        return mount(
            <TagEditorModal {...props} />,
        );
    }

    const tag = MockFactory.createTestTag();

    it("modal is initialized properly", () => {
        const onCancel = jest.fn();
        const onOk = jest.fn();
        const wrapper = createComponent({
            tag,
            showModal: false,
            onCancel,
            onOk,
        });
        const state = wrapper.find(TagEditorModal).state();
        expect(state.tag).toEqual(tag);
        expect(state.isOpen).toBe(false);
    });

    it("modal is not visible", () => {
        const onCancel = jest.fn();
        const onOk = jest.fn();
        const wrapper = createComponent({
            tag,
            showModal: false,
            onCancel,
            onOk,
        });
        expect(wrapper.find("div.modal-content").exists()).toBe(false);
        expect(wrapper.find("div.modal-header").exists()).toBe(false);
        expect(wrapper.find("div.modal-body").exists()).toBe(false);
    });

    it("modal is visible", () => {
        const onCancel = jest.fn();
        const onOk = jest.fn();
        const wrapper = createComponent({
            tag,
            showModal: true,
            onCancel,
            onOk,
        });
        expect(wrapper.find("div.modal-content").exists()).toBe(true);
        expect(wrapper.find("div.modal-header").exists()).toBe(true);
        expect(wrapper.find("div.modal-body").exists()).toBe(true);
    });

    it("modal calls 'onCancel' when cancel is clicked", () => {
        const onCancel = jest.fn();
        const onOk = jest.fn();
        const wrapper = createComponent({
            tag,
            showModal: true,
            onCancel,
            onOk,
        });
        expect(wrapper.find("div.modal-header").exists()).toBe(true);
        expect(wrapper.find("div.modal-body").exists()).toBe(true);
        wrapper.find("button.btn.btn-secondary").simulate("click");
        expect(onCancel).toBeCalled();
        expect(onOk).not.toBeCalled();
    });

    it("modal calls 'onOk' when ok is clicked", () => {
        const onCancel = jest.fn();
        const onOk = jest.fn();
        const wrapper = createComponent({
            tag,
            showModal: true,
            onCancel,
            onOk,
        });
        expect(wrapper.find("div.modal-header").exists()).toBe(true);
        expect(wrapper.find("div.modal-body").exists()).toBe(true);
        wrapper.find("button.btn.btn-success").simulate("click");
        expect(onOk).toBeCalled();
        expect(onCancel).not.toBeCalled();
    });

    it("Updates props via componentDidUpdate and calls 'onOk' when ok is clicked with new tag information", () => {
        const onCancel = jest.fn();
        const onOk = jest.fn();
        const wrapper = createComponent({
            tag,
            showModal: true,
            onCancel,
            onOk,
        });
        const newTagName = "new tag name";

        expect(wrapper.find("div.modal-header").exists()).toBe(true);
        expect(wrapper.find("div.modal-body").exists()).toBe(true);
        // Calls componentDidUpdate
        wrapper.setProps({
            tag: {
                name: newTagName,
                color: tag.color,
            },
        });
        wrapper.find("button.btn.btn-success").simulate("click");
        expect(onOk).toBeCalledWith({
            name: newTagName,
            color: tag.color,
        });
        expect(onCancel).not.toBeCalled();
    });
});
