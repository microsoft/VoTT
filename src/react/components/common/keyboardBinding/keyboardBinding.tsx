import { KeyboardContext, IKeyboardContext, KeyEventType } from "../keyboardManager/keyboardManager";
import React from "react";

export interface IKeyboardBindingProps {
    accelerators: string[];
    displayName: string;
    handler: (evt?: KeyboardEvent) => void;
    keyEventType?: KeyEventType;
    icon?: string;
}

export class KeyboardBinding extends React.Component<IKeyboardBindingProps> {
    public static contextType = KeyboardContext;
    public context!: IKeyboardContext;
    private deregisterBinding: () => void;

    public componentDidMount() {
        if (this.context && this.context.keyboard) {
            this.deregisterBinding = this.context.keyboard.registerBinding(this.props);
        } else {
            console.warn("Keyboard Mananger context cannot be found - Keyboard binding has NOT been set.");
        }
    }

    public componentWillUnmount() {
        if (this.deregisterBinding) {
            this.deregisterBinding();
        }
    }

    public render() {
        return null;
    }
}
