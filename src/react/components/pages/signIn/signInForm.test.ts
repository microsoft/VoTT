import React from "react";
import { ISignInFormProps, ISignInFormState, SignInForm } from "./signInForm";
import { ReactWrapper, mount } from "enzyme";
import MockFactory from "../../../../common/mockFactory";
import Form from "react-jsonschema-form";

describe("Sign In Form", () => {
    let wrapper: ReactWrapper<ISignInFormProps, ISignInFormState>;
    const onSubmitHandler = jest.fn();

    const defaultProps: ISignInFormProps = {
        signIn: {
            email: "",
            password: "",
            rememberUser: false,
        },
        onSubmit: onSubmitHandler,
    };

    function createComponent(props?: ISignInFormProps)
    : ReactWrapper<ISignInFormProps, ISignInFormState> {
    props = props || defaultProps;
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
        expect(wrapper.find("button#submitCredentials")).toEqual(1);
    });

    it("raises the submit handler on clicking the submit button", async () => {
        wrapper = createComponent();
        await MockFactory.flushUi(() => wrapper.find("form").simulate("submit"));
        expect(onSubmitHandler).toBeCalledWith(defaultProps);
    });

});
