import React from "react";
import { mount, ReactWrapper } from "enzyme";
import Confirm, { IConfirmProps, IConfirmState } from "./confirm";

describe("Confirm component", () => {
    const modalConfirmHandler = jest.fn();
    const modalCancelHandler = jest.fn();
    const defaultProps: IConfirmProps = {
        title: "Test Title",
        message: "Test Message",
        onConfirm: modalConfirmHandler,
        onCancel: modalCancelHandler,
    };

    function createComponent(props: IConfirmProps): ReactWrapper<IConfirmProps, IConfirmState, Confirm> {
        return mount(<Confirm {...props}></Confirm>);
    }

    it("Is defined", () => {
        expect(Confirm).toBeDefined();
    });

    it("Renders nothing if not activiated", () => {
        const wrapper = createComponent(defaultProps);
        expect(wrapper.html()).toBeNull();
    });

    it("Renders modal when activiated", () => {
        const wrapper = createComponent(defaultProps);

        wrapper.instance().open();
        wrapper.update();

        expect(wrapper.find(".modal-title").text()).toEqual(defaultProps.title);
        expect(wrapper.find(".modal-body").text()).toEqual(defaultProps.message);
        expect(wrapper.find(".modal-footer button").length).toEqual(2);
    });

    it("Renders custom button text / colors when properties are set", () => {
        const props: IConfirmProps = {
            ...defaultProps,
            confirmButtonColor: "success",
            confirmButtonText: "Yes",
            cancelButtonColor: "danger",
            cancelButtonText: "No",
        };
        const wrapper = createComponent(props);

        wrapper.instance().open();
        wrapper.update();

        const buttons = wrapper.find(".modal-footer button");
        expect(buttons.at(0).text()).toEqual(props.confirmButtonText);
        expect(buttons.at(0).hasClass("btn-success")).toBe(true);
        expect(buttons.at(1).text()).toEqual(props.cancelButtonText);
        expect(buttons.at(1).hasClass("btn-danger")).toBe(true);
    });

    it("Calls onConfirm handler when clicking positive button", () => {
        const arg = { value: "test" };
        const wrapper = createComponent(defaultProps);

        wrapper.instance().open(arg);
        wrapper.update();

        wrapper.find(".modal-footer button").first().simulate("click");
        expect(modalConfirmHandler).toBeCalledWith(arg);
    });

    it("Calls the onCancel handler when clicking the negative button", () => {
        const arg = { value: "test" };
        const wrapper = createComponent(defaultProps);

        wrapper.instance().open(arg);
        wrapper.update();

        wrapper.find(".modal-footer button").last().simulate("click");
        expect(modalCancelHandler).toBeCalledWith(arg);
    });
});
