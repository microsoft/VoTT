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

    afterEach(() => {
        const node = document.body;
        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }
    });

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

        expect(document.querySelector(".modal-title").textContent).toEqual(defaultProps.title);
        expect(document.querySelector(".modal-body").textContent).toEqual(defaultProps.message);
        expect(document.querySelectorAll("button").length).toEqual(2);
    });

    it("Renders a message from function handler", () => {
        const props = {
            ...defaultProps,
            message: (testObject) => testObject.value,
        };
        const testObject = {
            value: "A Test Message from function handler",
        };
        const wrapper = createComponent(props);
        wrapper.instance().open(testObject);

        expect(document.querySelector(".modal-body").textContent).toEqual(testObject.value);
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

        const buttons = document.querySelectorAll("button");
        expect(buttons[0].textContent).toEqual(props.confirmButtonText);
        expect(buttons[0].className.indexOf(props.confirmButtonColor)).toBeGreaterThan(-1);
        expect(buttons[1].textContent).toEqual(props.cancelButtonText);
        expect(buttons[1].className.indexOf(props.cancelButtonColor)).toBeGreaterThan(-1);
    });

    it("Calls onConfirm handler when clicking positive button", () => {
        const arg = { value: "test" };
        const wrapper = createComponent(defaultProps);
        wrapper.instance().open(arg);

        document.querySelectorAll("button")[0].click();
        expect(modalConfirmHandler).toBeCalledWith(arg);
    });

    it("Calls the onCancel handler when clicking the negative button", () => {
        const arg = { value: "test" };
        const wrapper = createComponent(defaultProps);
        wrapper.instance().open(arg);

        const buttons = document.querySelectorAll("button");
        buttons[buttons.length - 1].click();
        expect(modalCancelHandler).toBeCalledWith(arg);
    });
});
