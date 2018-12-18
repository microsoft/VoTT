import React from "react";
import TagEditorModal, {ITagEditorModalProps} from "./tagEditorModal";
import { mount } from "enzyme";
import { ITag } from "../../../../../models/applicationState";
import MockFactory from "../../../../../common/mockFactory";
// tslint:disable-next-line:no-var-requires
const TagColors = require("../tagColors.json");

describe("Tag Editor Modal", () => {

    function createComponent(props: ITagEditorModalProps) {
        return mount(
            <TagEditorModal {...props} />,
        ).find(TagEditorModal);
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
        const state = wrapper.state();
        expect(state.tag).toEqual(tag);
        expect(state.isOpen).toBeFalsy();
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
        expect(
            wrapper.find("div.ReactModal__Content.ReactModal__Content--after-open").exists(),
        ).toBeFalsy();
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
        expect(
            wrapper.find("div.ReactModal__Content.ReactModal__Content--after-open").exists(),
        ).toBeTruthy();
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
        expect(wrapper.find("div.ReactModal__Content.ReactModal__Content--after-open").exists()).toBeTruthy();
        wrapper.find("button").first().simulate("click");
        expect(onCancel).toBeCalled();
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
        expect(wrapper.find("div.ReactModal__Content.ReactModal__Content--after-open").exists()).toBeTruthy();
        wrapper.find("button").last().simulate("click");
        expect(onOk).toBeCalled();
    });

    xit("modal calls 'onOk' with new tag information", () => {
        const onCancel = jest.fn();
        const onOk = jest.fn();
        const wrapper = createComponent({
            tag,
            showModal: true,
            onCancel,
            onOk,
        });
        const newTagName = "new tag name";
        expect(wrapper.find("div.ReactModal__Content.ReactModal__Content--after-open").exists()).toBeTruthy();
        expect(wrapper.find("input#root_name.form-control")).toHaveLength(1);
        wrapper.find("input#root_name.form-control").simulate("change", {target: {value: newTagName}});
        expect(wrapper.state().tag.name).toEqual(newTagName);
        wrapper.find("button").last().simulate("click");
        expect(onOk).toBeCalledWith({
            name: newTagName,
            color: expect.stringMatching(/^#([0-9a-fA-F]{3}){1,2}$/i),
        });
    });
});
