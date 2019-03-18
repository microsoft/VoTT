import { KeyboardRegistrationManager } from "./keyboardRegistrationManager";
import { KeyEventType } from "./keyboardManager";
import { IKeyboardBindingProps } from "../keyboardBinding/keyboardBinding";

describe("Keyboard Registration Manager", () => {
    let keyboardManager: KeyboardRegistrationManager = null;

    function addHandler(keyboardManager: KeyboardRegistrationManager,
                        keyEventType: KeyEventType, accelerators: string[], handler) {
        const bindingProps: IKeyboardBindingProps = {
            accelerators,
            displayName: "test binding",
            handler,
            keyEventType,
        };
        return keyboardManager.registerBinding(bindingProps);
    }

    beforeEach(() => {
        keyboardManager = new KeyboardRegistrationManager();
    });

    it("is defined", () => {
        expect(KeyboardRegistrationManager).toBeDefined();
        expect(keyboardManager).not.toBeNull();
    });

    it("can add keybard event handlers", () => {
        const keyCode1 = "Ctrl+1";
        const handler1 = (evt: KeyboardEvent) => null;
        const keyCode2 = "Ctrl+S";
        const handler2 = (evt: KeyboardEvent) => null;

        addHandler(keyboardManager, KeyEventType.KeyDown, [keyCode1], handler1);
        addHandler(keyboardManager, KeyEventType.KeyDown, [keyCode2], handler2);

        const handlers1 = keyboardManager.getHandlers(KeyEventType.KeyDown, keyCode1);
        const handlers2 = keyboardManager.getHandlers(KeyEventType.KeyDown, keyCode2);

        expect(handlers1.length).toEqual(1);
        expect(handlers2.length).toEqual(1);

        expect(handlers1[0]).toBe(handler1);
        expect(handlers2[0]).toBe(handler2);
    });

    it("can register handlers for same key code and different key event types", () => {
        const keyCodeString = "Ctrl+H";
        const keyCodes = [keyCodeString];
        const handler1 = (evt: KeyboardEvent) => null;
        const handler2 = (evt: KeyboardEvent) => null;
        const handler3 = (evt: KeyboardEvent) => null;

        addHandler(keyboardManager, KeyEventType.KeyDown, keyCodes, handler1);

        addHandler(keyboardManager, KeyEventType.KeyUp, keyCodes, handler1);
        addHandler(keyboardManager, KeyEventType.KeyUp, keyCodes, handler2);

        addHandler(keyboardManager, KeyEventType.KeyPress, keyCodes, handler1);
        addHandler(keyboardManager, KeyEventType.KeyPress, keyCodes, handler2);
        addHandler(keyboardManager, KeyEventType.KeyPress, keyCodes, handler3);

        const keyDownHandlers = keyboardManager.getHandlers(KeyEventType.KeyDown, keyCodeString);
        expect(keyDownHandlers.length).toEqual(1);

        const keyUpHandlers = keyboardManager.getHandlers(KeyEventType.KeyUp, keyCodeString);
        expect(keyUpHandlers.length).toEqual(2);

        const keyPressHandlers = keyboardManager.getHandlers(KeyEventType.KeyPress, keyCodeString);
        expect(keyPressHandlers.length).toEqual(3);
    });

    it("can register multiple handlers for same key code", () => {
        const keyCode = "Ctrl+H";
        const handler1 = (evt: KeyboardEvent) => null;
        const handler2 = (evt: KeyboardEvent) => null;

        addHandler(keyboardManager, KeyEventType.KeyDown, [keyCode], handler1);
        addHandler(keyboardManager, KeyEventType.KeyDown, [keyCode], handler2);

        const handlers = keyboardManager.getHandlers(KeyEventType.KeyDown, keyCode);
        expect(handlers.length).toEqual(2);
    });

    it("list of handlers cannot be mutated outside of API", () => {
        const keyCode = "Ctrl+K";
        const handler = (evt: KeyboardEvent) => null;

        addHandler(keyboardManager, KeyEventType.KeyDown, [keyCode], handler);
        const handlers = keyboardManager.getHandlers(KeyEventType.KeyDown, keyCode);
        const handlerCount = handlers.length;

        // Attempt to add more handlers
        handlers.push(handler, handler, handler);

        const newHandlers = keyboardManager.getHandlers(KeyEventType.KeyDown, keyCode);
        expect(newHandlers.length).toEqual(handlerCount);
    });

    it("can remove keyboard event handlers", () => {
        const keyCode = "Ctrl+1";
        const handler = (evt: KeyboardEvent) => null;

        // Register keyboard handler
        const deregister = addHandler(keyboardManager, KeyEventType.KeyDown, [keyCode], handler);

        // Get registered handlers
        let handlers = keyboardManager.getHandlers(KeyEventType.KeyDown, keyCode);
        expect(handlers.length).toEqual(1);

        // Invoke deregister functions
        deregister();

        // Get registered handlers after deregistered
        handlers = keyboardManager.getHandlers(KeyEventType.KeyDown, keyCode);
        expect(handlers.length).toEqual(0);
    });

    it("get handlers for unregistered key code returns empty array", () => {
        const handlers = keyboardManager.getHandlers(KeyEventType.KeyDown, "Alt+1");
        expect(handlers.length).toEqual(0);
    });

    it("invokes registered keyboard handlers", () => {
        const keyCode = "Ctrl+1";
        const handler1 = jest.fn();
        const handler2 = jest.fn();

        addHandler(keyboardManager, KeyEventType.KeyDown, [keyCode], handler1);
        addHandler(keyboardManager, KeyEventType.KeyDown, [keyCode], handler2);

        const keyboardEvent = new KeyboardEvent("keydown", {
            ctrlKey: true,
            code: "1",
        });

        keyboardManager.invokeHandlers(KeyEventType.KeyDown, keyCode, keyboardEvent);

        expect(handler1).toBeCalledWith(keyboardEvent);
        expect(handler2).toBeCalledWith(keyboardEvent);
    });

    describe("array with mulitple keyCodes", () => {
        it("register all keycodes with the same eventType and handler", () => {
            const keyCode1 = "Ctrl+1";
            const keyCode2 = "Ctrl+S";
            const keyCodes = [keyCode1, keyCode2];
            const handler = jest.fn();

            addHandler(keyboardManager, KeyEventType.KeyDown, keyCodes, handler);

            const handlers1 = keyboardManager.getHandlers(KeyEventType.KeyDown, keyCode1);
            expect(handlers1.length).toEqual(1);
            expect(handlers1[0]).toEqual(handler);

            const handlers2 = keyboardManager.getHandlers(KeyEventType.KeyDown, keyCode2);
            expect(handlers2.length).toEqual(1);
            expect(handlers2[0]).toEqual(handler);
        });

        it("invoke the registered keyboard handlers", () => {
            const keyCode1 = "Ctrl+1";
            const keyCode2 = "ArrowUp";
            const keyCodes = [keyCode1, keyCode2];
            const handler = jest.fn();

            addHandler(keyboardManager, KeyEventType.KeyDown, keyCodes, handler);

            const keyboardEvent1 = new KeyboardEvent("keydown", {
                ctrlKey: true,
                code: "1",
            });

            keyboardManager.invokeHandlers(KeyEventType.KeyDown, keyCode1, keyboardEvent1);
            expect(handler).toBeCalledWith(keyboardEvent1);

            const keyboardEvent2 = new KeyboardEvent("keydown", {
                code: "ArrowUp",
            });

            keyboardManager.invokeHandlers(KeyEventType.KeyDown, keyCode1, keyboardEvent2);
            expect(handler).toBeCalledWith(keyboardEvent2);
        });

        it("correctly remove all associated handlers", () => {
            const keyCode1 = "Ctrl+1";
            const keyCode2 = "Ctrl+S";
            const keyCodes = [keyCode1, keyCode2];
            const handler = (evt: KeyboardEvent) => null;

            // Register keyboard handler
            const deregister = addHandler(keyboardManager, KeyEventType.KeyDown, keyCodes, handler);

            // Get registered handlers
            let handlers1 = keyboardManager.getHandlers(KeyEventType.KeyDown, keyCode1);
            expect(handlers1.length).toEqual(1);

            let handlers2 = keyboardManager.getHandlers(KeyEventType.KeyDown, keyCode2);
            expect(handlers2.length).toEqual(1);

            // Invoke deregister function
            deregister();

            // Get registered handlers after deregistered
            handlers1 = keyboardManager.getHandlers(KeyEventType.KeyDown, keyCode1);
            expect(handlers1.length).toEqual(0);

            handlers2 = keyboardManager.getHandlers(KeyEventType.KeyDown, keyCode2);
            expect(handlers2.length).toEqual(0);
        });
    });
});
