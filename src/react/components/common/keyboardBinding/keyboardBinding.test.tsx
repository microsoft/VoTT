import React from "react";
import { mount, ReactWrapper } from "enzyme";
import { KeyboardManager, KeyEventType } from "../keyboardManager/keyboardManager";
import { KeyboardBinding, IKeyboardBindingProps } from "./keyboardBinding";

jest.mock("../keyboardManager/keyboardRegistrationManager");
import { KeyboardRegistrationManager } from "../keyboardManager/keyboardRegistrationManager";

describe("Keyboard Binding Component", () => {
    let wrapper: ReactWrapper = null;
    const onKeyDownHandler = jest.fn();
    const deregisterFunc = jest.fn();

    const accelerators = ["Ctrl+1"];
    const defaultProps: IKeyboardBindingProps = {
        keyEventType: KeyEventType.KeyDown,
        accelerators,
        onKeyEvent: onKeyDownHandler,
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

    it("is defined", () => {
        wrapper = createComponent();
        expect(wrapper).not.toBeNull();
    });

    it("does not render anything", () => {
        wrapper = createComponent();
        expect(wrapper.find(KeyboardBinding).html()).toBeNull();
    });

    it("registered the keydown key code and event handler", () => {
        wrapper = createComponent();
        expect(registrationMock.prototype.addHandler).toBeCalledWith(
            KeyEventType.KeyDown, defaultProps.accelerators, defaultProps.onKeyEvent);
    });

    it("registered the keyup key code and event handler", () => {
        wrapper = createComponent({
            ...defaultProps,
            keyEventType: KeyEventType.KeyUp,
        });
        expect(registrationMock.prototype.addHandler).toBeCalledWith(
            KeyEventType.KeyUp, defaultProps.accelerators, defaultProps.onKeyEvent);
    });

    it("registered the keypress key code and event handler", () => {
        wrapper = createComponent({
            ...defaultProps,
            keyEventType: KeyEventType.KeyPress,
        });
        expect(registrationMock.prototype.addHandler).toBeCalledWith(
            KeyEventType.KeyPress, defaultProps.accelerators, defaultProps.onKeyEvent);
    });

    it("deregisters the event handler", () => {
        wrapper = createComponent();
        wrapper.unmount();
        expect(deregisterFunc).toBeCalled();
    });
});
