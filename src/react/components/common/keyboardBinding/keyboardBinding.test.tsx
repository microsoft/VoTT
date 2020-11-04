import React from "react";
import { mount, ReactWrapper } from "enzyme";
import { KeyboardManager, KeyEventType } from "../keyboardManager/keyboardManager";
import { KeyboardBinding, IKeyboardBindingProps } from "./keyboardBinding";

jest.mock("../keyboardManager/keyboardRegistrationManager");
import { KeyboardRegistrationManager } from "../keyboardManager/keyboardRegistrationManager";

describe("Keyboard Binding Component", () => {
    let wrapper: ReactWrapper = null;
    let onKeyDownHandler = null;
    let deregisterFunc = null;
    let defaultProps: IKeyboardBindingProps = null
    const accelerators = ["CmdOrCtrl+1"];

    let registrationMock = null;

    function createComponent(props?: IKeyboardBindingProps): ReactWrapper {
        props = props || defaultProps;

        return mount(
            <KeyboardManager>
                <KeyboardBinding {...props} />
            </KeyboardManager>,
        );
    }

    beforeEach(() => {
        onKeyDownHandler = jest.fn();
        deregisterFunc = jest.fn();

        defaultProps = {
            displayName: "Keyboard binding",
            keyEventType: KeyEventType.KeyDown,
            accelerators,
            handler: onKeyDownHandler,
        };

        registrationMock = KeyboardRegistrationManager as jest.Mocked<typeof KeyboardRegistrationManager>;
        registrationMock.prototype.registerBinding = jest.fn(() => deregisterFunc);
    });

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
        const expectedBindingProps: IKeyboardBindingProps = {
            accelerators: defaultProps.accelerators,
            keyEventType: KeyEventType.KeyDown,
            handler: defaultProps.handler,
            displayName: expect.any(String),
        };
        expect(registrationMock.prototype.registerBinding).toBeCalledWith(expectedBindingProps);
    });

    it("registered the keyup key code and event handler", () => {
        wrapper = createComponent({
            ...defaultProps,
            keyEventType: KeyEventType.KeyUp,
        });
        const expectedBindingProps: IKeyboardBindingProps = {
            accelerators: defaultProps.accelerators,
            keyEventType: KeyEventType.KeyUp,
            handler: defaultProps.handler,
            displayName: expect.any(String),
        };
        expect(registrationMock.prototype.registerBinding).toBeCalledWith(expectedBindingProps);
    });

    it("registered the keypress key code and event handler", () => {
        wrapper = createComponent({
            ...defaultProps,
            keyEventType: KeyEventType.KeyPress,
        });
        const expectedBindingProps: IKeyboardBindingProps = {
            accelerators: defaultProps.accelerators,
            keyEventType: KeyEventType.KeyPress,
            handler: defaultProps.handler,
            displayName: expect.any(String),
        };
        expect(registrationMock.prototype.registerBinding).toBeCalledWith(expectedBindingProps);
    });

    it("deregisters the event handler", () => {
        wrapper = createComponent();
        wrapper.unmount();
        expect(deregisterFunc).toBeCalled();
    });
});
