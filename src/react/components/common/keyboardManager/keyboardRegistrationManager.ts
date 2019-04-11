import Guard from "../../../../common/guard";
import { KeyboardManager, KeyEventType } from "./keyboardManager";
import { IKeyboardBindingProps } from "../keyboardBinding/keyboardBinding";
import { AppError, ErrorCode } from "../../../../models/applicationState";

/**
 * A map of keyboard event registrations
 */
export interface IKeyboardRegistrations {
    [keyEventType: string]: {
        [key: string]: IKeyboardBindingProps,
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
        const {keyEventType, accelerators, handler, displayName} = binding;
        Guard.null(keyEventType);
        Guard.expression(accelerators, (keyCodes) => keyCodes.length > 0);
        Guard.null(handler);

        let eventTypeRegistrations = this.registrations[keyEventType];
        if (!eventTypeRegistrations) {
            eventTypeRegistrations = {};
            this.registrations[keyEventType] = eventTypeRegistrations;
        }

        accelerators.forEach((keyCode) => {
            const currentBinding = this.registrations[keyEventType][keyCode];
            if (currentBinding) {
                let error = `Key code ${keyCode} on key event "${keyEventType}" `;
                error += `already has binding registered: "${currentBinding.displayName}." `;
                error += `Cannot register binding "${displayName}" with the same key code and key event type`;
                throw new AppError(ErrorCode.OverloadedKeyBinding, error);
            }
            this.registrations[keyEventType][keyCode] = binding;
        });

        return () => {
            binding.accelerators.forEach((keyCode) => {
                delete this.registrations[binding.keyEventType][keyCode];
            });
        };
    }

    /**
     * Gets a list of registered event handlers for the specified key code
     * @param keyEventType Type of key event (keydown, keyup, keypress)
     * @param keyCode The key code combination, ex) CmdOrCtrl+1
     */
    public getHandler(keyEventType: KeyEventType, keyCode: string): (evt?: KeyboardEvent) => void {
        Guard.null(keyEventType);
        Guard.null(keyCode);

        const keyEventTypeRegs = this.registrations[keyEventType];
        return (keyEventTypeRegs && keyEventTypeRegs[keyCode])
            ?
            keyEventTypeRegs[keyCode].handler
            :
            null;
    }

    /**
     * Invokes all registered event handlers for the specified key code\
     * @param keyEventType Type of key event (keydown, keyup, keypress)
     * @param keyCode The key code combination, ex) CmdOrCtrl+1
     * @param evt The keyboard event that was raised
     */
    public invokeHandler(keyEventType: KeyEventType, keyCode: string, evt: KeyboardEvent) {
        Guard.null(keyCode);
        Guard.null(evt);

        const handler = this.getHandler(keyEventType, keyCode);
        if (handler !== null) {
            handler(evt);
        }
    }

    public getRegistrations = () => {
        return this.registrations;
    }
}
