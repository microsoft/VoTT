import { KeyboardContext, IKeyboardContext, KeyEventType } from "../keyboardManager/keyboardManager";
import React from "react";

export interface IKeyboardBindingProps {
    accelerator: string;
    keyEventType: KeyEventType;
    onKeyEvent: (evt?: KeyboardEvent) => void;
}

export class KeyboardBinding extends React.Component<IKeyboardBindingProps> {
    public static contextType = KeyboardContext;
    public context!: IKeyboardContext;
    private deregisterBinding: () => void;

    public componentDidMount() {
        this.deregisterBinding = this.context.keyboard.addHandler(
            this.props.keyEventType,
            this.props.accelerator,
            this.props.onKeyEvent);
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
