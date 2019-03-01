import React, { SyntheticEvent } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";

/**
 * Accepts any number of parameters and returns a string
 */
export type MessageFormatHandler = (...params: any[]) => string;

/**
 * Properties for Message Box component
 * @member title - Title for message box
 * @member message - Message for message box
 * @member params - Array of additional parameters
 * @member onButtonSelect - Function to call when button is selected
 * @member onCancel - Function to call upon cancel
 */
export interface IMessageBoxProps {
    title: string;
    message: string | Element | MessageFormatHandler;
    params?: any[];
    onButtonSelect?: (button: HTMLButtonElement) => void;
    onCancel?: () => void;
    show?: boolean;
}

/**
 * State for Message Box
 * @member isOpen - Message box is open
 * @member isRendered - Message box is rendered
 * @member isButtonSelected - Message box button is selected
 */
export interface IMessageBoxState {
    isOpen: boolean;
    isRendered: boolean;
    isButtonSelected: boolean;
}

/**
 * Generic modal that displays a message
 */
export default class MessageBox extends React.Component<IMessageBoxProps, IMessageBoxState> {
    constructor(props, context) {
        super(props, context);

        this.state = {
            isOpen: props.show,
            isRendered: props.show,
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

        return (
            <Modal className="messagebox-modal"
                isOpen={this.state.isOpen}
                onClosed={this.onClosed}>
                <ModalHeader toggle={this.toggle}>{this.props.title}</ModalHeader>
                <ModalBody>{this.getMessage(this.props.message)}</ModalBody>
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

    public componentDidUpdate(prevProps: Readonly<IMessageBoxProps>): void {
        if (prevProps.show !== this.props.show) {
            this.setState({
                isOpen: this.props.show,
                isRendered: this.props.show,
            });
        }
    }

    private getMessage = (message: string | MessageFormatHandler | Element) => {
        if (typeof message === "function") {
            return message.apply(this, this.props.params);
        } else {
            return message;
        }
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
