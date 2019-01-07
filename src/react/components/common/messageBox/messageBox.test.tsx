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
        wrapper.update();

        expect(wrapper.find(".modal-title").text()).toEqual(defaultProps.title);
        expect(wrapper.find(".modal-body").text()).toEqual(defaultProps.message);
        expect(wrapper.find(".modal-footer button").length).toEqual(3);
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
        wrapper.update();

        expect(wrapper.find(".modal-body").text()).toEqual(testObject.value);
    });

    it("Calls onButtonSelect when a button is clicked", () => {
        const wrapper = createComponent(defaultProps);

        wrapper.instance().open();
        wrapper.update();

        const button = wrapper.find(".modal-footer button").at(2);
        button.simulate("click");

        expect(buttonSelectHandler).toBeCalledWith(button.getDOMNode());
    });

    it("Calls onCancel when close button is clicked", () => {
        const wrapper = createComponent(defaultProps);

        wrapper.instance().open();
        wrapper.update();

        wrapper.find(".modal-header button.close").simulate("click");

        expect(cancelHandler).toBeCalled();
    });
});
