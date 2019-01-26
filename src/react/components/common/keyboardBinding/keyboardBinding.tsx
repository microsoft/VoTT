import { KeyboardContext, IKeyboardContext } from "../keyboardManager/keyboardManager";
import React from "react";

export interface IKeyboardBindingProps {
    accelerator: string;
    onKeyDown: (evt?: KeyboardEvent) => void;
}

export class KeyboardBinding extends React.Component<IKeyboardBindingProps> {
    public static contextType = KeyboardContext;
    public context!: IKeyboardContext;
    private deregisterBinding: () => void;

    constructor(props, context) {
        super(props, context);

        this.deregisterBinding = this.context.keyboard.addHandler(this.props.accelerator, this.props.onKeyDown);
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
