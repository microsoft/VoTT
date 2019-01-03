import React from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";

export type MessageFormatHandler = (...params: any[]) => string;

export interface IMessageBoxProps {
    title: string;
    message: string | MessageFormatHandler;
    params?: any[];
}

export interface IMessageBoxState {
    isOpen: boolean;
}

export default class MessageBox extends React.Component<IMessageBoxProps, IMessageBoxState> {
    constructor(props, context) {
        super(props, context);

        this.state = {
            isOpen: false,
        };

        this.open = this.open.bind(this);
        this.close = this.close.bind(this);
    }

    public render() {
        if (!this.state.isOpen) {
            return null;
        }

        const messageText = typeof this.props.message === "string"
            ? this.props.message
            : this.props.message.apply(this, this.props.params);

        return (
            <Modal className="confirm-modal" isOpen={this.state.isOpen}>
                <ModalHeader>{this.props.title}</ModalHeader>
                <ModalBody>{messageText}</ModalBody>
                <ModalFooter>
                    {this.props.children}
                </ModalFooter>
            </Modal>
        );
    }

    public open(): void {
        this.setState({
            isOpen: true,
        });
    }

    public close(): void {
        this.setState({
            isOpen: false,
        });
    }
}
