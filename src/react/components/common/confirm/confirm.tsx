import React, { RefObject } from "react";
import { Button } from "reactstrap";
import MessageBox, { IMessageBoxProps } from "../messageBox/messageBox";

/**
 * Properties for Confirm Component
 * @member confirmButtonText - Text displayed on 'Confirm' button. Default 'Yes'
 * @member cancelButtonText - Text displayed on 'Cancel' button. Default 'No'
 * @member confirmButtonColor - Color of 'Confirm' button. Default 'primary'
 * @member cancelButtonColor - Color of 'Cancel' button. Default 'secondary'
 * @member onConfirm - Function to call on confirm
 * @member onCancel - Function to call on cancel
 */
export interface IConfirmProps extends IMessageBoxProps {
    confirmButtonText?: string;
    cancelButtonText?: string;
    confirmButtonColor?: string;
    cancelButtonColor?: string;
    onConfirm: (...params: any[]) => void;
    onCancel?: (...params: any[]) => void;
}

/**
 * State for Confirm Component
 * @member params - Open ended parameters that are passed on opening modal
 */
export interface IConfirmState {
    params: any[];
}

/**
 * @name - Confirm
 * @description - Dialog for confirming an action
 */
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
                params={this.state.params}
                onCancel={this.onCancelClick}>
                <Button
                    autoFocus={true}
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

    /**
     * Open Confirm Dialog
     * @param params - Array of parameters passed to onConfirm function
     */
    public open(...params: any[]): void {
        this.setState({ params }, () => this.messageBox.current.open());
    }

    /**
     * Close Confirm Dialog
     */
    public close(): void {
        this.messageBox.current.close();
    }

    private onConfirmClick() {
        this.props.onConfirm.apply(null, this.state.params);
    }

    private onCancelClick() {
        if (this.props.onCancel) {
            this.props.onCancel.apply(null, this.state.params);
        }
    }
}
