import Guard from "../../../../common/guard";

/**
 * A map of keyboard event registrations
 */
export interface IKeyboardRegistrations {
    [keyEventType: string]: {
        [key: string]: KeyboardEventHandler[]
    }
}

/**
 * Types of Key events supported by registration manager
 */
export enum KeyEventType {
    KeyDown = "keydown",
    KeyUp = "keyup",
    KeyPress = "keypress",
}

/**
 * An event handler that responds to keyboard events
 */
export type KeyboardEventHandler = (evt?: KeyboardEvent) => void;

/**
 * Managers keyboard event registrations
 */
export class KeyboardRegistrationManager {
    private registrations: IKeyboardRegistrations = {};

    /**
     * Registers a keyboard event handler for the specified key code
     * @param keyCode The key code combination, ex) Ctrl+1
     * @param handler The keyboard event handler
     */
    public addHandler(keyEventType: KeyEventType, keyCode: string, handler: KeyboardEventHandler): () => void {
        Guard.null(keyCode);
        Guard.null(handler);

        let eventTypeRegistrations = this.registrations[keyEventType];
        if (!eventTypeRegistrations) {
            eventTypeRegistrations = {};
            this.registrations[keyEventType] = eventTypeRegistrations;
        }

        let keyRegistrations: KeyboardEventHandler[] = this.registrations[keyEventType][keyCode];
        if (!keyRegistrations) {
            keyRegistrations = [];
            this.registrations[keyEventType][keyCode] = keyRegistrations;
        }

        keyRegistrations.push(handler);

        return () => {
            const index = keyRegistrations.findIndex((h) => h === handler);
            keyRegistrations.splice(index, 1);
        };
    }

    /**
     * Gets a list of registered event handlers for the specified key code
     * @param keyCode The key code combination, ex) Ctrl+1
     */
    public getHandlers(keyEventType: KeyEventType, keyCode: string) {
        Guard.null(keyCode);

        const registrations = this.registrations[keyEventType][keyCode];
        return registrations ? [...registrations] : [];
    }

    /**
     * Invokes all registered event handlers for the specified key code
     * @param keyCode The key code combination, ex) Ctrl+1
     * @param evt The keyboard event that was raised
     */
    public invokeHandlers(keyEventType: KeyEventType, keyCode: string, evt: KeyboardEvent) {
        Guard.null(keyCode);
        Guard.null(evt);

        const handlers = this.getHandlers(keyEventType, keyCode);
        handlers.forEach((handler) => handler(evt));
    }
}
