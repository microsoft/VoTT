import React from "react";
import { KeyboardRegistrationManager, KeyEventType } from "./keyboardRegistrationManager";

export const KeyboardContext = React.createContext<IKeyboardContext>(null);

export interface IKeyboardContext {
    keyboard: KeyboardRegistrationManager;
}

export class KeyboardManager extends React.Component<any, IKeyboardContext> {
    public static contextType = KeyboardContext;

    public state: IKeyboardContext = {
        keyboard: new KeyboardRegistrationManager(),
    };

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

    private onKeyDown = (evt: KeyboardEvent) => {
        if (evt.key === "Ctrl" || evt.key === "Control" || evt.key === "Alt") {
            return;
        }

        const keyParts = [];
        if (evt.ctrlKey) {
            keyParts.push("Ctrl+");
        }
        if (evt.altKey) {
            keyParts.push("Alt+");
        }
        keyParts.push(evt.key);

        this.state.keyboard.invokeHandlers(KeyEventType.KeyDown, keyParts.join(""), evt);
    }

    private onKeyUp = (evt: KeyboardEvent) => {
        this.state.keyboard.invokeHandlers(KeyEventType.KeyUp, evt.key, evt);
    }

    private onKeyPress = (evt: KeyboardEvent) => {
        if (evt.key === "Ctrl" || evt.key === "Control" || evt.key === "Alt") {
            return;
        }

        const keyParts = [];
        if (evt.ctrlKey) {
            keyParts.push("Ctrl+");
        }
        if (evt.altKey) {
            keyParts.push("Alt+");
        }
        keyParts.push(evt.key);

        this.state.keyboard.invokeHandlers(KeyEventType.KeyPress, keyParts.join(""), evt);
    }
}
