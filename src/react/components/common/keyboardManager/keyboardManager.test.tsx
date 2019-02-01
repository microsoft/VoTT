import React from "react";
import { mount, ReactWrapper } from "enzyme";
import { KeyboardManager, IKeyboardContext } from "./keyboardManager";

jest.mock("./keyboardRegistrationManager");
import { KeyboardRegistrationManager } from "./keyboardRegistrationManager";

describe("Keyboard Manager Component", () => {
    let wrapper: ReactWrapper<{}, IKeyboardContext> = null;
    let addEventListenerSpy: jest.SpyInstance = null;
    let removeEventListenerSpy: jest.SpyInstance = null;

    function createComponent(): ReactWrapper<{}, IKeyboardContext> {
        return mount(
            <KeyboardManager>
                <div className="child">Hello - I am a child component</div>
            </KeyboardManager>,
        );
    }

    beforeEach(() => {
        addEventListenerSpy = jest.spyOn(window, "addEventListener");
        removeEventListenerSpy = jest.spyOn(window, "removeEventListener");
        wrapper = createComponent();
    });

    it("is defined", () => {
        expect(wrapper).not.toBeNull();
    });

    it("initial state is defined", () => {
        expect(wrapper.state().keyboard).toBeInstanceOf(KeyboardRegistrationManager);
    });

    it("registers event handlers for keydown events", () => {
        expect(addEventListenerSpy).toBeCalled();
        expect(removeEventListenerSpy).toBeCalled();
    });

    it("renders all child components", () => {
        expect(wrapper.find(".child").exists()).toBe(true);
    });

    it("listens for Ctrl+ keydown events and invokes handlers", () => {
        const keyboardEvent = new KeyboardEvent("keydown", {
            ctrlKey: true,
            key: "1",
        });

        window.dispatchEvent(keyboardEvent);

        const registrationManagerMock = KeyboardRegistrationManager as jest.Mocked<typeof KeyboardRegistrationManager>;
        expect(registrationManagerMock.prototype.invokeHandlers).toBeCalledWith("Ctrl+1", keyboardEvent);
    });

    it("listens for Alt+ keydown events and invokes handlers", () => {
        const keyboardEvent = new KeyboardEvent("keydown", {
            ctrlKey: false,
            altKey: true,
            key: "1",
        });

        window.dispatchEvent(keyboardEvent);

        const registrationManagerMock = KeyboardRegistrationManager as jest.Mocked<typeof KeyboardRegistrationManager>;
        expect(registrationManagerMock.prototype.invokeHandlers).toBeCalledWith("Alt+1", keyboardEvent);
    });

    it("listens for keydown events and invokes handlers", () => {
        const keyboardEvent = new KeyboardEvent("keydown", {
            ctrlKey: false,
            altKey: false,
            key: "F1",
        });

        window.dispatchEvent(keyboardEvent);

        const registrationManagerMock = KeyboardRegistrationManager as jest.Mocked<typeof KeyboardRegistrationManager>;
        expect(registrationManagerMock.prototype.invokeHandlers).toBeCalledWith("F1", keyboardEvent);
    });
});
