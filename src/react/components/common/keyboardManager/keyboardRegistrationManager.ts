import Guard from "../../../../common/guard";
import { KeyboardManager, KeyEventType } from "./keyboardManager";
import { IKeyboardBindingProps } from "../keyboardBinding/keyboardBinding";

/**
 * A map of keyboard event registrations
 */
export interface IKeyboardRegistrations {
    [keyEventType: string]: {
        [key: string]: IKeyboardBindingProps[],
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
     * Registers a keyboard binding and returns a function to deregister that binding
     * @param binding Properties for keyboard binding (type of key event, keyCodes, handler, etc.)
     * @returns a function for deregistering the keyboard binding
     */
    public registerBinding = (binding: IKeyboardBindingProps) => {
        Guard.null(binding.keyEventType);
        Guard.expression(binding.accelerators, (keyCodes) => keyCodes.length > 0);
        Guard.null(binding.handler);

        let eventTypeRegistrations = this.registrations[binding.keyEventType];
        if (!eventTypeRegistrations) {
            eventTypeRegistrations = {};
            this.registrations[binding.keyEventType] = eventTypeRegistrations;
        }

        binding.accelerators.forEach((keyCode) => {
            let keyRegistrations: IKeyboardBindingProps[] = this.registrations[binding.keyEventType][keyCode];
            if (!keyRegistrations) {
                keyRegistrations = [];
                this.registrations[binding.keyEventType][keyCode] = keyRegistrations;
            }

            keyRegistrations.push(binding);
        });

        return () => {
            binding.accelerators.forEach((keyCode) => {
                const keyRegistrations: IKeyboardBindingProps[] = this.registrations[binding.keyEventType][keyCode];
                const index = keyRegistrations.findIndex((b) => b === binding);
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
        return (keyEventTypeRegs && keyEventTypeRegs[keyCode])
            ?
            [...keyEventTypeRegs[keyCode].map((binding) => binding.handler)]
            :
            [];
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

    public getRegistrations = () => {
        return this.registrations;
    }
}
