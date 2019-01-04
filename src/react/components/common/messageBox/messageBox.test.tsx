import React from "react";
import { mount, ReactWrapper } from "enzyme";
import MessageBox, { IMessageBoxProps, IMessageBoxState } from "./messageBox";
import { Button } from "reactstrap";

describe("MessageBox component", () => {
    const buttonSelectHandler = jest.fn();
    const cancelHandler = jest.fn();

    const defaultProps: IMessageBoxProps = {
        title: "Test Title",
        message: "Test Message",
        onButtonSelect: buttonSelectHandler,
        onCancel: cancelHandler,
    };

    function createComponent(props: IMessageBoxProps): ReactWrapper<IMessageBoxProps, IMessageBoxState, MessageBox> {
        return mount(
            <MessageBox {...props}>
                <Button autoFocus={true}>Yes</Button>
                <Button>No</Button>
                <Button>Cancel</Button>
            </MessageBox>);
    }

    afterEach(() => {
        const node = document.body;
        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }
    });

    it("Is defined", () => {
        expect(MessageBox).toBeDefined();
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
        expect(document.querySelectorAll(".modal-footer button").length).toEqual(3);
    });

    it("Renders a message from function handler", () => {
        const testObject = {
            value: "A Test Message from function handler",
        };
        const props: IMessageBoxProps = {
            ...defaultProps,
            message: (testObject) => testObject.value,
            params: [testObject],
        };
        const wrapper = createComponent(props);
        wrapper.instance().open();

        expect(document.querySelector(".modal-body").textContent).toEqual(testObject.value);
    });

    it("Calls onButtonSelect when a button is clicked", () => {
        const wrapper = createComponent(defaultProps);
        wrapper.instance().open();

        const button = document.querySelectorAll("button")[2];
        button.click();

        expect(buttonSelectHandler).toBeCalledWith(button);
    });

    it("Calls onCancel when close button is clicked", () => {
        const wrapper = createComponent(defaultProps);
        wrapper.instance().open();

        const closeButton = document.querySelector("button.close") as HTMLButtonElement;
        closeButton.click();

        expect(cancelHandler).toBeCalled();
    });
});
