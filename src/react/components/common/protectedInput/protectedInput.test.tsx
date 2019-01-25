import React from "react";
import { mount, ReactWrapper } from "enzyme";
import { ProtectedInput, IProtectedInputProps, IProtectedInputState } from "./protectedInput";
import { generateKey } from "../../../../common/crypto";

describe("Protected Input Component", () => {
    const onChangeHandler = jest.fn();
    const defaultProps: IProtectedInputProps = {
        id: "protected-input",
        value: "",
        onChange: onChangeHandler,
    };

    beforeAll(() => {
        const clipboard = (navigator as any).clipboard;
        if (!(clipboard && clipboard.writeText)) {
            (navigator as any).clipboard = {
                writeText: jest.fn(() => Promise.resolve()),
            };
        }
    });

    function createComponent(props: IProtectedInputProps): ReactWrapper<IProtectedInputProps, IProtectedInputState> {
        return mount(<ProtectedInput {...props} />);
    }

    it("renders correctly", () => {
        const wrapper = createComponent(defaultProps);
        expect(wrapper.find("input").exists()).toBe(true);
        expect(wrapper.find("input").prop("type")).toEqual("password");
        expect(wrapper.find("input").prop("readOnly")).not.toBeDefined();
        expect(wrapper.find(".btn-visibility").exists()).toBe(true);
        expect(wrapper.find(".btn-copy").exists()).toBe(true);
    });

    it("renders as read-only if property is set", () => {
        const props = {
            ...defaultProps,
            readOnly: true,
        };
        const wrapper = createComponent(props);
        expect(wrapper.find("input").prop("readOnly")).toEqual(true);
    });

    it("sets default state", () => {
        const wrapper = createComponent(defaultProps);
        expect(wrapper.state()).toEqual({
            showKey: false,
            value: "",
        });
    });

    it("calls onChange event handler with bound value on load", () => {
        const expectedValue = generateKey();
        const props = {
            ...defaultProps,
            value: expectedValue,
        };

        createComponent(props);
        expect(onChangeHandler).toBeCalledWith(expectedValue);
    });

    it("calls onChange event handler when the input value changes", () => {
        const expectedValue = generateKey();
        const wrapper = createComponent(defaultProps);
        wrapper.find("input").simulate("change", { target: { value: expectedValue } });

        expect(onChangeHandler).toBeCalledWith(expectedValue);
        expect(wrapper.state().value).toEqual(expectedValue);
    });

    it("toggles input type when clicking the visibility button", () => {
        const wrapper = createComponent(defaultProps);
        wrapper.find("button.btn-visibility").simulate("click");

        expect(wrapper.find("input").prop("type")).toEqual("text");
        expect(wrapper.state().showKey).toBe(true);

        wrapper.find("button.btn-visibility").simulate("click");

        expect(wrapper.find("input").prop("type")).toEqual("password");
        expect(wrapper.state().showKey).toBe(false);
    });

    it("copies the input value to the clipboard when clicking on the copy button", () => {
        const expectedValue = generateKey();
        const wrapper = createComponent({
            ...defaultProps,
            value: expectedValue,
        });

        wrapper.find("button.btn-copy").simulate("click");

        const clipboard = (navigator as any).clipboard;
        expect(clipboard.writeText).toBeCalledWith(expectedValue);
    });
});
