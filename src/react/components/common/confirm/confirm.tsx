import React from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from "reactstrap";

export type MessageFormatHandler = (...params: any[]) => string;

export interface IConfirmProps {
    title: string;
    message: string | MessageFormatHandler;
    confirmButtonText?: string;
    cancelButtonText?: string;
    confirmButtonColor?: string;
    cancelButtonColor?: string;
    onConfirm: (...params: any[]) => void;
    onCancel?: (...params: any[]) => void;
}

export interface IConfirmState {
    isOpen: boolean;
    params: any[];
}

export default class Confirm extends React.Component<IConfirmProps, IConfirmState> {
    constructor(props, context) {
        super(props, context);

        this.state = {
            isOpen: false,
            params: null,
        };

        this.open = this.open.bind(this);
        this.close = this.close.bind(this);
        this.onConfirmClick = this.onConfirmClick.bind(this);
        this.onCancelClick = this.onCancelClick.bind(this);
    }

    public render() {
        if (!this.state.isOpen) {
            return null;
        }

        const messageText = typeof this.props.message === "string"
            ? this.props.message
            : this.props.message.apply(this, this.state.params);

        return (
            <Modal className="confirm-modal" isOpen={this.state.isOpen}>
                <ModalHeader>{this.props.title}</ModalHeader>
                <ModalBody>{messageText}</ModalBody>
                <ModalFooter>
                    <Button color={this.props.confirmButtonColor || "primary"}
                        onClick={this.onConfirmClick}>{this.props.confirmButtonText || "Yes"}</Button>
                    <Button color={this.props.cancelButtonColor || "secondary"}
                        onClick={this.onCancelClick}>{this.props.cancelButtonText || "No"}</Button>
                </ModalFooter>
            </Modal>
        );
    }

    public open(...params: any[]): void {
        this.setState({
            isOpen: true,
            params,
        });
    }

    public close(): void {
        this.setState({
            isOpen: false,
        });
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
