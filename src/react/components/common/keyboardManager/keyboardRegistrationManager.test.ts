import { KeyboardRegistrationManager, KeyEventType } from "./keyboardRegistrationManager";

describe("Keyboard Registration Manager", () => {
    let keyboardManager: KeyboardRegistrationManager = null;

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

        keyboardManager.addHandler(KeyEventType.KeyDown, keyCode1, handler1);
        keyboardManager.addHandler(KeyEventType.KeyDown, keyCode2, handler2);

        const handlers1 = keyboardManager.getHandlers(KeyEventType.KeyDown, keyCode1);
        const handlers2 = keyboardManager.getHandlers(KeyEventType.KeyDown, keyCode2);

        expect(handlers1.length).toEqual(1);
        expect(handlers2.length).toEqual(1);

        expect(handlers1[0]).toBe(handler1);
        expect(handlers2[0]).toBe(handler2);
    });

    it("can register multiple handlers for same key code", () => {
        const keyCode = "Ctrl+H";
        const handler1 = (evt: KeyboardEvent) => null;
        const handler2 = (evt: KeyboardEvent) => null;

        keyboardManager.addHandler(KeyEventType.KeyDown, keyCode, handler1);
        keyboardManager.addHandler(KeyEventType.KeyDown, keyCode, handler2);

        const handlers = keyboardManager.getHandlers(KeyEventType.KeyDown, keyCode);
        expect(handlers.length).toEqual(2);
    });

    it("list of handlers cannot be mutated outside of API", () => {
        const keyCode = "Ctrl+K";
        const handler1 = (evt: KeyboardEvent) => null;

        keyboardManager.addHandler(KeyEventType.KeyDown, keyCode, handler1);
        const handlers = keyboardManager.getHandlers(KeyEventType.KeyDown, keyCode);
        const handlerCount = handlers.length;

        // Attempt to add more handlers
        handlers.push(handler1, handler1, handler1);

        const newHandlers = keyboardManager.getHandlers(KeyEventType.KeyDown, keyCode);
        expect(newHandlers.length).toEqual(handlerCount);
    });

    it("can remove keyboard event handlers", () => {
        const keyCode1 = "Ctrl+1";
        const handler1 = (evt: KeyboardEvent) => null;

        // Register keyboard handler
        const deregister = keyboardManager.addHandler(KeyEventType.KeyDown, keyCode1, handler1);

        // Get registered handlers
        let handlers1 = keyboardManager.getHandlers(KeyEventType.KeyDown, keyCode1);
        expect(handlers1.length).toEqual(1);

        // Invode deregister functions
        deregister();

        // Get registered handlers after deregistered
        handlers1 = keyboardManager.getHandlers(KeyEventType.KeyDown, keyCode1);
        expect(handlers1.length).toEqual(0);
    });

    it("get handlers for unregistered key code returns emtpy array", () => {
        const handlers = keyboardManager.getHandlers(KeyEventType.KeyDown, "Alt+1");
        expect(handlers.length).toEqual(0);
    });

    it("invokes registered keyboard handlers", () => {
        const keyCode = "Ctrl+1";
        const handler1 = jest.fn();
        const handler2 = jest.fn();

        keyboardManager.addHandler(KeyEventType.KeyDown, keyCode, handler1);
        keyboardManager.addHandler(KeyEventType.KeyDown, keyCode, handler2);

        const keyboardEvent = new KeyboardEvent("keydown", {
            ctrlKey: true,
            code: "1",
        });

        keyboardManager.invokeHandlers(KeyEventType.KeyDown, keyCode, keyboardEvent);

        expect(handler1).toBeCalledWith(keyboardEvent);
        expect(handler2).toBeCalledWith(keyboardEvent);
    });
});
