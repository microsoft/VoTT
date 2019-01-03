import React, { RefObject } from "react";
import { Button } from "reactstrap";
import MessageBox, { IMessageBoxProps } from "../../messageBox/messageBox";

export interface IConfirmProps extends IMessageBoxProps {
    confirmButtonText?: string;
    cancelButtonText?: string;
    confirmButtonColor?: string;
    cancelButtonColor?: string;
    onConfirm: (...params: any[]) => void;
    onCancel?: (...params: any[]) => void;
}

export interface IConfirmState {
    params: any[];
}

export default class Confirm extends React.Component<IConfirmProps, IConfirmState> {
    private messageBox: RefObject<MessageBox>;

    constructor(props, context) {
        super(props, context);

        this.state = {
            params: null,
        };

        this.messageBox = React.createRef<MessageBox>();

        this.open = this.open.bind(this);
        this.close = this.close.bind(this);
        this.onConfirmClick = this.onConfirmClick.bind(this);
        this.onCancelClick = this.onCancelClick.bind(this);
    }

    public render() {
        return (
            <MessageBox ref={this.messageBox}
                title={this.props.title}
                message={this.props.message}
                params={this.state.params}>
                <Button
                    color={this.props.confirmButtonColor || "primary"}
                    onClick={this.onConfirmClick}>{this.props.confirmButtonText || "Yes"}
                </Button>
                <Button
                    color={this.props.cancelButtonColor || "secondary"}
                    onClick={this.onCancelClick}>{this.props.cancelButtonText || "No"}
                </Button>
            </MessageBox>
        );
    }

    public open(...params: any[]): void {
        this.setState({ params }, () => this.messageBox.current.open());
    }

    public close(): void {
        this.messageBox.current.close();
    }

    private onConfirmClick() {
        this.close();
        this.props.onConfirm.apply(null, this.state.params);
    }

    private onCancelClick() {
        this.close();
        if (this.props.onCancel) {
            this.props.onCancel.apply(null, this.state.params);
        }
    }
}
