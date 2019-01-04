import React, { SyntheticEvent } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";

export type MessageFormatHandler = (...params: any[]) => string;

export interface IMessageBoxProps {
    title: string;
    message: string | MessageFormatHandler;
    params?: any[];
    onButtonSelect?: (button: HTMLButtonElement) => void;
    onCancel?: () => void;
}

export interface IMessageBoxState {
    isOpen: boolean;
    isRendered: boolean;
    isButtonSelected: boolean;
}

export default class MessageBox extends React.Component<IMessageBoxProps, IMessageBoxState> {
    constructor(props, context) {
        super(props, context);

        this.state = {
            isOpen: false,
            isRendered: false,
            isButtonSelected: false,
        };

        this.toggle = this.toggle.bind(this);
        this.open = this.open.bind(this);
        this.close = this.close.bind(this);
        this.onFooterClick = this.onFooterClick.bind(this);
        this.onClosed = this.onClosed.bind(this);
    }

    public render() {
        if (!this.state.isRendered) {
            return null;
        }

        const messageText = typeof this.props.message === "string"
            ? this.props.message
            : this.props.message.apply(this, this.props.params);

        return (
            <Modal className="messagebox-modal"
                isOpen={this.state.isOpen}
                onClosed={this.onClosed}>
                <ModalHeader toggle={this.toggle}>{this.props.title}</ModalHeader>
                <ModalBody>{messageText}</ModalBody>
                <ModalFooter onClick={this.onFooterClick}>
                    {this.props.children}
                </ModalFooter>
            </Modal>
        );
    }

    public open(): void {
        this.setState({
            isOpen: true,
            isRendered: true,
            isButtonSelected: false,
        });
    }

    public close(): void {
        this.setState({
            isOpen: false,
        }, () => {
            if (!this.state.isButtonSelected && this.props.onCancel) {
                this.props.onCancel();
            }
        });
    }

    private onFooterClick(evt: SyntheticEvent) {
        const htmlElement = evt.target as HTMLButtonElement;
        if (htmlElement.tagName === "BUTTON") {
            this.setState({
                isButtonSelected: true,
            }, () => {
                this.close();
                if (this.props.onButtonSelect) {
                    this.props.onButtonSelect(htmlElement);
                }
            });
        }
    }

    private toggle() {
        if (this.state.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    private onClosed() {
        this.setState({
            isRendered: false,
        });
    }
}
