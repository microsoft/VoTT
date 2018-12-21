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
        ).toBe(false);
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
        ).toBe(true);
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
        wrapper.find("button").last().simulate("click");
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
        const okButton = wrapper.find("button").first();
        expect(okButton.exists()).toBeTruthy();
        okButton.simulate("click");
        setImmediate(() => {
            expect(onOk).toBeCalledWith(tag);
        });
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

        expect(wrapper.find("div.ReactModal__Content.ReactModal__Content--after-open").exists()).toBeTruthy();
        // Calls componentDidUpdate
        wrapper.setProps({
            tag: {
                name: newTagName,
                color: tag.color,
            },
        });
        const okButton = wrapper.find("button").first();
        expect(okButton.exists()).toBeTruthy();
        okButton.simulate("click");
        setImmediate(() => {
            expect(onOk).toBeCalledWith({
                name: newTagName,
                color: tag.color,
            });
        });
    });
});
