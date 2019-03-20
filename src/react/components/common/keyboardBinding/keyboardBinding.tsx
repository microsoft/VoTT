import { KeyboardContext, IKeyboardContext, KeyEventType } from "../keyboardManager/keyboardManager";
import React from "react";

/**
 * Properties needed for a keyboard binding
 */
export interface IKeyboardBindingProps {
    /** Keys that the action is bound to */
    accelerators: string[];
    /** Friendly name for keyboard binding for display in help menu */
    displayName: string;
    /** Action to trigger upon key event */
    handler: (evt?: KeyboardEvent) => void;
    /** Type of key event (keypress, keyup, keydown) */
    keyEventType?: KeyEventType;
    /** Icon to display in help menu */
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
