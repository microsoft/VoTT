import React from "react";
import { ISignInFormProps, ISignInFormState, SignInForm } from "./signInForm";
import { ReactWrapper, mount } from "enzyme";
import Form from "react-jsonschema-form";

describe("Sign In Form", () => {
    let wrapper: ReactWrapper<ISignInFormProps, ISignInFormState>;
    const onSubmitHandler = jest.fn();

    const defaultProps: ISignInFormProps = {
        signIn: {
            email: "some@domain.com",
            password: "$ecreT",
            rememberUser: false,
        },
        onSubmit: onSubmitHandler,
    };

    function createComponent(props: ISignInFormProps = defaultProps)
    : ReactWrapper<ISignInFormProps, ISignInFormState> {
        return mount(<SignInForm {...props} />);
    }

    it("initializes default state", () => {
        wrapper = createComponent();
        const state = wrapper.state();
        expect(state.formSchema).not.toBeNull();
        expect(state.uiSchema).not.toBeNull();
        expect(state.formData).not.toBeNull();
    });

    it("renders a dynamic json schema form with default props and submit button", () => {
        wrapper = createComponent();
        expect(wrapper.find(Form).exists()).toBe(true);
        expect(wrapper.state().formData).toEqual(defaultProps.signIn);
        expect(wrapper.find("button#submitCredentials").exists()).toBe(true);
    });

    it("raises the submit handler on clicking the submit button", async () => {
        wrapper = createComponent();
        wrapper.find("form").simulate("submit");
        expect(onSubmitHandler).toBeCalledWith(defaultProps.signIn);
    });

});
