import Guard from "../../../../common/guard";

/**
 * A map of keyboard event registrations
 */
export interface IKeyboardRegistrations {
    [key: string]: KeyboardEventHandler[];
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
    public addHandler(keyCode: string, handler: KeyboardEventHandler): () => void {
        Guard.emtpy(keyCode);
        Guard.null(handler);

        let keyRegistrations: KeyboardEventHandler[] = this.registrations[keyCode];
        if (!keyRegistrations) {
            keyRegistrations = [];
            this.registrations[keyCode] = keyRegistrations;
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
    public getHandlers(keyCode: string) {
        Guard.emtpy(keyCode);

        const registrations = this.registrations[keyCode];
        return registrations ? [...registrations] : [];
    }

    /**
     * Invokes all registered event handlers for the specified key code
     * @param keyCode The key code combination, ex) Ctrl+1
     * @param evt The keyboard event that was raised
     */
    public invokeHandlers(keyCode: string, evt: KeyboardEvent) {
        Guard.emtpy(keyCode);
        Guard.null(evt);

        const handlers = this.getHandlers(keyCode);
        handlers.forEach((handler) => handler(evt));
    }
}
