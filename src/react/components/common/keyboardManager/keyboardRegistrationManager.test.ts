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

    it("can add keyboard event handlers", () => {
        const keyCode1 = "CmdOrCtrl+1";
        const handler1 = (evt: KeyboardEvent) => null;
        const keyCode2 = "CmdOrCtrl+S";
        const handler2 = (evt: KeyboardEvent) => null;

        addHandler(keyboardManager, KeyEventType.KeyDown, [keyCode1], handler1);
        addHandler(keyboardManager, KeyEventType.KeyDown, [keyCode2], handler2);

        const h1 = keyboardManager.getHandler(KeyEventType.KeyDown, keyCode1);
        const h2 = keyboardManager.getHandler(KeyEventType.KeyDown, keyCode2);

        expect(h1).toBe(handler1);
        expect(h2).toBe(handler2);
    });

    it("can register handlers for same key code and different key event types", () => {
        const keyCodeString = "CmdOrCtrl+H";
        const keyCodes = [keyCodeString];
        const keyDownHandler = (evt: KeyboardEvent) => null;
        const keyUpHandler = (evt: KeyboardEvent) => null;
        const keyPressHandler = (evt: KeyboardEvent) => null;

        addHandler(keyboardManager, KeyEventType.KeyDown, keyCodes, keyDownHandler);

        addHandler(keyboardManager, KeyEventType.KeyUp, keyCodes, keyUpHandler);

        addHandler(keyboardManager, KeyEventType.KeyPress, keyCodes, keyPressHandler);

        expect(keyboardManager.getHandler(KeyEventType.KeyDown, keyCodeString)).toBe(keyDownHandler);
        expect(keyboardManager.getHandler(KeyEventType.KeyUp, keyCodeString)).toBe(keyUpHandler);
        expect(keyboardManager.getHandler(KeyEventType.KeyPress, keyCodeString)).toBe(keyPressHandler);
    });

    it("throws error when trying to register multiple handlers for same key code", () => {
        const keyCode = "CmdOrCtrl+H";
        const handler1 = (evt: KeyboardEvent) => null;
        const handler2 = (evt: KeyboardEvent) => null;

        addHandler(keyboardManager, KeyEventType.KeyDown, [keyCode], handler1);
        expect(() => addHandler(keyboardManager, KeyEventType.KeyDown, [keyCode], handler2)).toThrowError();
    });

    it("can remove keyboard event handlers", () => {
        const keyCode = "CmdOrCtrl+1";

        // Register keyboard handler
        const deregister = addHandler(keyboardManager, KeyEventType.KeyDown, [keyCode], jest.fn());

        // Get registered handlers
        let handler = keyboardManager.getHandler(KeyEventType.KeyDown, keyCode);
        expect(handler).not.toBeNull();

        // Invoke deregister functions
        deregister();

        // Get registered handlers after deregistered
        handler = keyboardManager.getHandler(KeyEventType.KeyDown, keyCode);
        expect(handler).toBeNull();
    });

    it("get handler for unregistered key code returns null", () => {
        const handler = keyboardManager.getHandler(KeyEventType.KeyDown, "Alt+1");
        expect(handler).toBeNull();
    });

    describe("array with mulitple keyCodes", () => {
        it("register all keycodes with the same eventType and handler", () => {
            const keyCode1 = "CmdOrCtrl+1";
            const keyCode2 = "CmdOrCtrl+S";
            const keyCodes = [keyCode1, keyCode2];
            const handler = jest.fn();

            addHandler(keyboardManager, KeyEventType.KeyDown, keyCodes, handler);

            expect(keyboardManager.getHandler(KeyEventType.KeyDown, keyCode1)).toBe(handler);
            expect(keyboardManager.getHandler(KeyEventType.KeyDown, keyCode2)).toBe(handler);
        });

        it("invoke the registered keyboard handlers", () => {
            const keyCode1 = "CmdOrCtrl+1";
            const keyCode2 = "ArrowUp";
            const keyCodes = [keyCode1, keyCode2];
            const handler = jest.fn();

            addHandler(keyboardManager, KeyEventType.KeyDown, keyCodes, handler);

            const keyboardEvent1 = new KeyboardEvent("keydown", {
                ctrlKey: true,
                code: "1",
            });

            keyboardManager.invokeHandler(KeyEventType.KeyDown, keyCode1, keyboardEvent1);
            expect(handler).toBeCalledWith(keyboardEvent1);

            const keyboardEvent2 = new KeyboardEvent("keydown", {
                code: "ArrowUp",
            });

            keyboardManager.invokeHandler(KeyEventType.KeyDown, keyCode1, keyboardEvent2);
            expect(handler).toBeCalledWith(keyboardEvent2);
        });

        it("correctly remove all associated handlers", () => {
            const keyCode1 = "CmdOrCtrl+1";
            const keyCode2 = "CmdOrCtrl+S";
            const keyCodes = [keyCode1, keyCode2];
            const handler = (evt: KeyboardEvent) => null;

            // Register keyboard handler
            const deregister = addHandler(keyboardManager, KeyEventType.KeyDown, keyCodes, handler);

            // Get registered handlers
            let h1 = keyboardManager.getHandler(KeyEventType.KeyDown, keyCode1);
            expect(h1).toBe(handler);

            let h2 = keyboardManager.getHandler(KeyEventType.KeyDown, keyCode2);
            expect(h2).toBe(handler);

            // Invoke deregister function
            deregister();

            // Get registered handlers after deregistered
            h1 = keyboardManager.getHandler(KeyEventType.KeyDown, keyCode1);
            expect(h1).toBeNull();

            h2 = keyboardManager.getHandler(KeyEventType.KeyDown, keyCode2);
            expect(h2).toBeNull();
        });
    });
});
