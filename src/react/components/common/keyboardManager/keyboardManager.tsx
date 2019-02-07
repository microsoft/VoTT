import React from "react";
import { KeyboardRegistrationManager } from "./keyboardRegistrationManager";

export const KeyboardContext = React.createContext<IKeyboardContext>(null);

/**
 * Types of Key events supported by registration manager
 */
export enum KeyEventType {
    KeyDown = "keydown",
    KeyUp = "keyup",
    KeyPress = "keypress",
}

export interface IKeyboardContext {
    keyboard: KeyboardRegistrationManager;
}

export class KeyboardManager extends React.Component<any, IKeyboardContext> {
    public static contextType = KeyboardContext;

    public state: IKeyboardContext = {
        keyboard: new KeyboardRegistrationManager(),
    };

    private nonSupportedKeys = new Set(["Ctrl", " Control", "Alt"]);

    public componentDidMount() {
        window.addEventListener(KeyEventType.KeyDown, this.onKeyDown);
        window.addEventListener(KeyEventType.KeyUp, this.onKeyUp);
        window.addEventListener(KeyEventType.KeyPress, this.onKeyPress);
    }

    public componentWillUnmount() {
        window.removeEventListener(KeyEventType.KeyDown, this.onKeyDown);
        window.removeEventListener(KeyEventType.KeyUp, this.onKeyUp);
        window.removeEventListener(KeyEventType.KeyPress, this.onKeyPress);
    }

    public render() {
        return (
            <KeyboardContext.Provider value={this.state}>
                {this.props.children}
            </KeyboardContext.Provider>
        );
    }

    private getKeyParts(evt: KeyboardEvent) {
        const keyParts = [];
        if (evt.ctrlKey) {
            keyParts.push("Ctrl+");
        }
        if (evt.altKey) {
            keyParts.push("Alt+");
        }
        keyParts.push(evt.key);
        return keyParts.join("");
    }

    private onKeyDown = (evt: KeyboardEvent) => {
        if (this.nonSupportedKeys.has(evt.key)) {
            return;
        }
        this.state.keyboard.invokeHandlers(KeyEventType.KeyDown, this.getKeyParts(evt), evt);
    }

    private onKeyUp = (evt: KeyboardEvent) => {
        if (this.nonSupportedKeys.has(evt.key)) {
            return;
        }
        this.state.keyboard.invokeHandlers(KeyEventType.KeyUp, this.getKeyParts(evt), evt);
    }

    private onKeyPress = (evt: KeyboardEvent) => {
        if (this.nonSupportedKeys.has(evt.key)) {
            return;
        }
        this.state.keyboard.invokeHandlers(KeyEventType.KeyPress, this.getKeyParts(evt), evt);
    }
}
