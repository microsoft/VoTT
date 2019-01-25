import React from "react";
import { ISecurityTokenPickerProps, SecurityTokenPicker } from "./securityTokenPicker";
import { ReactWrapper, mount } from "enzyme";
import MockFactory from "../../../../common/mockFactory";

describe("Security Token Picker", () => {
    const onChangeHandler = jest.fn();
    const defaultProps: ISecurityTokenPickerProps = {
        id: "security-token-picker",
        value: "",
        securityTokens: [],
        onChange: onChangeHandler,
    };

    function createComponent(props: ISecurityTokenPickerProps): ReactWrapper<ISecurityTokenPickerProps> {
        return mount(<SecurityTokenPicker {...props} />);
    }

    it("renders correctly", () => {
        const wrapper = createComponent(defaultProps);
        expect(wrapper.find("select").exists()).toBe(true);
        expect(wrapper.find("select").prop("value")).toEqual("");
        expect(wrapper.find("option").text()).toEqual("Generate New Security Token");
    });

    it("renders and selected correct value", () => {
        const securityTokens = MockFactory.createSecurityTokens();
        const expectedToken = securityTokens[1];
        const props: ISecurityTokenPickerProps = {
            ...defaultProps,
            value: expectedToken.name,
            securityTokens,
        };

        const wrapper = createComponent(props);
        expect(wrapper.find("select").prop("value")).toEqual(expectedToken.name);
    });

    it("renders a list of security tokens", () => {
        const props = {
            ...defaultProps,
            securityTokens: MockFactory.createSecurityTokens(),
        };
        const wrapper = createComponent(props);
        expect(wrapper.find("option").length).toEqual(props.securityTokens.length + 1);
    });

    it("calls the onChange event handler when value changes", () => {
        const props: ISecurityTokenPickerProps = {
            ...defaultProps,
            securityTokens: MockFactory.createSecurityTokens(),
        };
        const expectedToken = props.securityTokens[1];
        const wrapper = createComponent(props);
        wrapper.find("select").simulate("change", { target: { value: expectedToken.name } });

        expect(onChangeHandler).toBeCalledWith(expectedToken.name);
    });
});
