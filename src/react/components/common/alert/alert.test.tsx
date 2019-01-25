import React from "react";
import { mount, ReactWrapper } from "enzyme";
import Alert, { IAlertProps, IAlertState } from "./alert";

describe("Alert component", () => {
    const modalCloseHandler = jest.fn();
    const defaultProps: IAlertProps = {
        title: "Test Title",
        message: "Test Message",
        onClose: modalCloseHandler,
        show: false,
    };

    function createComponent(props: IAlertProps): ReactWrapper<IAlertProps, IAlertState, Alert> {
        return mount(<Alert {...props}></Alert>);
    }

    it("Is defined", () => {
        expect(Alert).toBeDefined();
    });

    it("Renders nothing if not activated", () => {
        const wrapper = createComponent(defaultProps);
        expect(wrapper.html()).toBeNull();
    });

    it("Renders modal when activated", () => {
        const wrapper = createComponent(defaultProps);

        wrapper.instance().open();
        wrapper.update();

        expect(wrapper.find(".modal-title").text()).toEqual(defaultProps.title);
        expect(wrapper.find(".modal-body").text()).toEqual(defaultProps.message);
        expect(wrapper.find(".modal-footer button").length).toEqual(1);
    });

    it("Renders custom button text / colors when properties are set", () => {
        const props: IAlertProps = {
            ...defaultProps,
            closeButtonColor: "success",
            closeButtonText: "Close",
        };
        const wrapper = createComponent(props);

        wrapper.instance().open();
        wrapper.update();

        const buttons = wrapper.find(".modal-footer button");
        expect(buttons.first().text()).toEqual(props.closeButtonText);
        expect(buttons.first().hasClass("btn-success")).toBe(true);
    });

    it("Calls onClose handler when clicking positive button", () => {
        const arg = {value: "test"};
        const wrapper = createComponent(defaultProps);

        wrapper.instance().open(arg);
        wrapper.update();

        wrapper.find(".modal-footer button").first().simulate("click");
        expect(modalCloseHandler).toBeCalledWith(arg);
    });

    it("Renders modal if prop.show is set to true", () => {
        const props: IAlertProps = {
            title: "Test Title",
            message: "Test Message",
            onClose: modalCloseHandler,
            show: true,
        };

        const wrapper = createComponent(props);
        expect(wrapper.find(".modal-title").text()).toEqual(defaultProps.title);
        expect(wrapper.find(".modal-body").text()).toEqual(defaultProps.message);
        expect(wrapper.find(".modal-footer button").length).toEqual(1);
    });

});
