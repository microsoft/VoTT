import React from "react";
import { mount, ReactWrapper } from "enzyme";
import Alert, { IAlertProps, IAlertState } from "./alert";

describe("Alert component", () => {
    const modalCloseHandler = jest.fn();
    const defaultProps: IAlertProps = {
        title: "Test Title",
        message: "Test Message",
        onClose: modalCloseHandler,
    };

    function createComponent(props: IAlertProps): ReactWrapper<IAlertProps, IAlertState, Alert> {
        return mount(<Alert {...props}></Alert>);
    }

    afterEach(() => {
        const node = document.body;
        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }
    });

    it("Is defined", () => {
        expect(Alert).toBeDefined();
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
        expect(document.querySelectorAll(".modal-footer button").length).toEqual(1);
    });

    it("Renders custom button text / colors when properties are set", () => {
        const props: IAlertProps = {
            ...defaultProps,
            closeButtonColor: "success",
            closeButtonText: "Close",
        };
        const wrapper = createComponent(props);
        wrapper.instance().open();

        const buttons = document.querySelectorAll(".modal-footer button");
        expect(buttons[0].textContent).toEqual(props.closeButtonText);
        expect(buttons[0].className.indexOf(props.closeButtonColor)).toBeGreaterThan(-1);
    });

    it("Calls onClose handler when clicking positive button", () => {
        const arg = { value: "test" };
        const wrapper = createComponent(defaultProps);
        wrapper.instance().open(arg);

        (document.querySelectorAll(".modal-footer button")[0] as HTMLButtonElement).click();
        expect(modalCloseHandler).toBeCalledWith(arg);
    });
});
