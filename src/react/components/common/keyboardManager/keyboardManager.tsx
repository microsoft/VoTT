import React from "react";
import { KeyboardRegistrationManager } from "./keyboardRegistrationManager";

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
        window.addEventListener("keydown", this.onKeyDown);
    }

    public componentWillUnmount() {
        window.removeEventListener("keydown", this.onKeyDown);
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

        this.state.keyboard.invokeHandlers(keyParts.join(""), evt);
    }
}
