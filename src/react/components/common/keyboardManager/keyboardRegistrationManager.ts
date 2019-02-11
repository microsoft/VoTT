import Guard from "../../../../common/guard";
import { KeyEventType } from "./keyboardManager";

/**
 * A map of keyboard event registrations
 */
export interface IKeyboardRegistrations {
    [keyEventType: string]: {
        [key: string]: KeyboardEventHandler[],
    };
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
     * @param keyEventType Type of key event (keydown, keyup, keypress)
     * @param keyCodes a list of key code and key code combinations, ex) Ctrl+1
     * @param handler The keyboard event handler
     *
     * @returns a function for deregistering the handler
     */
    public addHandler(keyEventType: KeyEventType, keyCodes: string[], handler: KeyboardEventHandler): () => void {
        Guard.null(keyEventType);
        Guard.null(keyCodes);
        Guard.null(handler);

        let eventTypeRegistrations = this.registrations[keyEventType];
        if (!eventTypeRegistrations) {
            eventTypeRegistrations = {};
            this.registrations[keyEventType] = eventTypeRegistrations;
        }

        keyCodes.map((keyCode) => {
            let keyRegistrations: KeyboardEventHandler[] = this.registrations[keyEventType][keyCode];
            if (!keyRegistrations) {
                keyRegistrations = [];
                this.registrations[keyEventType][keyCode] = keyRegistrations;
            }

            keyRegistrations.push(handler);
        });

        return () => {
            keyCodes.map((keyCode) => {
                const keyRegistrations: KeyboardEventHandler[] = this.registrations[keyEventType][keyCode];
                const index = keyRegistrations.findIndex((h) => h === handler);

                keyRegistrations.splice(index, 1);
            });
        };
    }

    /**
     * Gets a list of registered event handlers for the specified key code
     * @param keyEventType Type of key event (keydown, keyup, keypress)
     * @param keyCode The key code combination, ex) Ctrl+1
     */
    public getHandlers(keyEventType: KeyEventType, keyCode: string) {
        Guard.null(keyEventType);
        Guard.null(keyCode);

        const keyEventTypeRegs = this.registrations[keyEventType];
        return (keyEventTypeRegs && keyEventTypeRegs[keyCode]) ? [...keyEventTypeRegs[keyCode]] : [];
    }

    /**
     * Invokes all registered event handlers for the specified key code\
     * @param keyEventType Type of key event (keydown, keyup, keypress)
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
