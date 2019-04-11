import React from "react";
import { mount, ReactWrapper } from "enzyme";
import { KeyboardManager, IKeyboardContext } from "./keyboardManager";
import { KeyEventType } from "./keyboardManager";

jest.mock("./keyboardRegistrationManager");
import { KeyboardRegistrationManager } from "./keyboardRegistrationManager";

describe("Keyboard Manager Component", () => {
    const registrationManagerMock = KeyboardRegistrationManager as jest.Mocked<typeof KeyboardRegistrationManager>;
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
        (registrationManagerMock.prototype.invokeHandler as any).mockClear();
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

    it("listens for CmdOrCtrl+ keydown events and invokes handlers", () => {
        const keyboardEvent = new KeyboardEvent(
            KeyEventType.KeyDown, {
                ctrlKey: true,
                key: "1",
            });

        window.dispatchEvent(keyboardEvent);

        expect(registrationManagerMock.prototype.invokeHandler)
            .toBeCalledWith(KeyEventType.KeyDown, "CmdOrCtrl+1", keyboardEvent);
    });

    it("listens for CmdOrCtrl+ keyup events and invokes handlers", () => {
        const keyboardEvent = new KeyboardEvent(
            KeyEventType.KeyUp, {
                ctrlKey: true,
                key: "1",
            });

        window.dispatchEvent(keyboardEvent);

        expect(registrationManagerMock.prototype.invokeHandler)
            .toBeCalledWith(KeyEventType.KeyUp, "CmdOrCtrl+1", keyboardEvent);
    });

    it("listens for CmdOrCtrl+ keypress events and invokes handlers", () => {
        const keyboardEvent = new KeyboardEvent(
            KeyEventType.KeyPress, {
                ctrlKey: true,
                key: "1",
            });

        window.dispatchEvent(keyboardEvent);

        expect(registrationManagerMock.prototype.invokeHandler)
            .toBeCalledWith(KeyEventType.KeyPress, "CmdOrCtrl+1", keyboardEvent);
    });

    it("listens for Alt+ keydown events and invokes handlers", () => {
        const keyboardEvent = new KeyboardEvent(
            KeyEventType.KeyDown, {
                ctrlKey: false,
                altKey: true,
                key: "1",
            });

        window.dispatchEvent(keyboardEvent);

        expect(registrationManagerMock.prototype.invokeHandler)
            .toBeCalledWith(KeyEventType.KeyDown, "Alt+1", keyboardEvent);
    });

    it("listens for Alt+ keyup events and invokes handlers", () => {
        const keyboardEvent = new KeyboardEvent(
            KeyEventType.KeyUp, {
                ctrlKey: false,
                altKey: true,
                key: "1",
            });

        window.dispatchEvent(keyboardEvent);

        expect(registrationManagerMock.prototype.invokeHandler)
            .toBeCalledWith(KeyEventType.KeyUp, "Alt+1", keyboardEvent);
    });

    it("listens for Alt+ keypress events and invokes handlers", () => {
        const keyboardEvent = new KeyboardEvent(
            KeyEventType.KeyPress, {
                ctrlKey: false,
                altKey: true,
                key: "1",
            });

        window.dispatchEvent(keyboardEvent);

        expect(registrationManagerMock.prototype.invokeHandler)
            .toBeCalledWith(KeyEventType.KeyPress, "Alt+1", keyboardEvent);
    });

    it("listens for keydown events and invokes handlers", () => {
        const keyboardEvent = new KeyboardEvent(
            KeyEventType.KeyDown, {
                ctrlKey: false,
                altKey: false,
                key: "F1",
            });

        window.dispatchEvent(keyboardEvent);

        expect(registrationManagerMock.prototype.invokeHandler)
            .toBeCalledWith(KeyEventType.KeyDown, "F1", keyboardEvent);
    });

    it("listens for keyup events and invokes handlers", () => {
        const keyboardEvent = new KeyboardEvent(
            KeyEventType.KeyUp, {
                ctrlKey: false,
                altKey: false,
                key: "F1",
            });

        window.dispatchEvent(keyboardEvent);

        expect(registrationManagerMock.prototype.invokeHandler)
            .toBeCalledWith(KeyEventType.KeyUp, "F1", keyboardEvent);
    });

    it("listens for keypress events and invokes handlers", () => {
        const keyboardEvent = new KeyboardEvent(
            KeyEventType.KeyPress, {
                ctrlKey: false,
                altKey: false,
                key: "F1",
            });

        window.dispatchEvent(keyboardEvent);

        expect(registrationManagerMock.prototype.invokeHandler)
            .toBeCalledWith(KeyEventType.KeyPress, "F1", keyboardEvent);
    });

    describe("Disabling keyboard manager", () => {
        it("ignores keyboard events when UI is focused on an input element", () => {
            const keyboardEvent = new KeyboardEvent(
                KeyEventType.KeyPress, {
                    ctrlKey: false,
                    altKey: false,
                    key: "a",
                });

            Object.defineProperty(document, "activeElement", {
                get: jest.fn(() => document.createElement("input")),
                configurable: true,
            });

            window.dispatchEvent(keyboardEvent);

            expect(registrationManagerMock.prototype.invokeHandler).not.toBeCalled();
        });

        it("ignores keyboard events when UI is focused on an textarea element", () => {
            const keyboardEvent = new KeyboardEvent(
                KeyEventType.KeyPress, {
                    ctrlKey: false,
                    altKey: false,
                    key: "a",
                });

            Object.defineProperty(document, "activeElement", {
                get: jest.fn(() => document.createElement("textarea")),
                configurable: true,
            });

            window.dispatchEvent(keyboardEvent);

            expect(registrationManagerMock.prototype.invokeHandler).not.toBeCalled();
        });

        it("ignores keyboard events when UI is focused on select elements", () => {
            const keyboardEvent = new KeyboardEvent(
                KeyEventType.KeyPress, {
                    ctrlKey: false,
                    altKey: false,
                    key: "a",
                });

            Object.defineProperty(document, "activeElement", {
                get: jest.fn(() => document.createElement("select")),
                configurable: true,
            });

            window.dispatchEvent(keyboardEvent);

            expect(registrationManagerMock.prototype.invokeHandler).not.toBeCalled();
        });

        it("does not ignore keyboard events when UI is focused on other form elements", () => {
            const keyboardEvent = new KeyboardEvent(
                KeyEventType.KeyPress, {
                    ctrlKey: false,
                    altKey: false,
                    key: "a",
                });

            Object.defineProperty(document, "activeElement", {
                get: jest.fn(() => document.createElement("button")),
                configurable: true,
            });

            window.dispatchEvent(keyboardEvent);

            expect(registrationManagerMock.prototype.invokeHandler).toBeCalled();
        });
    });
});
