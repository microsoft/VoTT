import React from "react";
import { mount, ReactWrapper } from "enzyme";
import { KeyboardManager } from "../keyboardManager/keyboardManager";
import { KeyboardBinding, IKeyboardBindingProps } from "./keyboardBinding";

jest.mock("../keyboardManager/keyboardRegistrationManager");
import { KeyboardRegistrationManager } from "../keyboardManager/keyboardRegistrationManager";

describe("Keyboard Binding Component", () => {
    let wrapper: ReactWrapper = null;
    const onKeyDownHandler = jest.fn();
    const deregisterFunc = jest.fn();

    const defaultProps: IKeyboardBindingProps = {
        accelerator: "Ctrl+1",
        onKeyDown: onKeyDownHandler,
    };

    const registrationMock = KeyboardRegistrationManager as jest.Mocked<typeof KeyboardRegistrationManager>;
    registrationMock.prototype.addHandler = jest.fn(() => deregisterFunc);

    function createComponent(props?: IKeyboardBindingProps): ReactWrapper {
        props = props || defaultProps;

        return mount(
            <KeyboardManager>
                <KeyboardBinding {...props} />
            </KeyboardManager>,
        );
    }

    beforeEach(() => {
        wrapper = createComponent();
    });

    it("is defined", () => {
        expect(wrapper).not.toBeNull();
    });

    it("does not render anything", () => {
        expect(wrapper.find(KeyboardBinding).html()).toBeNull();
    });

    it("registered the key code and event handler", () => {
        expect(registrationMock.prototype.addHandler).toBeCalledWith(defaultProps.accelerator, defaultProps.onKeyDown);
    });

    it("deregisters the event handler", () => {
        wrapper.unmount();
        expect(deregisterFunc).toBeCalled();
    });
});
