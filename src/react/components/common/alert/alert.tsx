import React, { RefObject } from "react";
import { Button } from "reactstrap";
import MessageBox, { IMessageBoxProps } from "../messageBox/messageBox";

export interface IAlertProps extends IMessageBoxProps {
    closeButtonText?: string;
    closeButtonColor?: string;
    onClose?: () => void;
}

export interface IAlertState {
    params: any[];
}

export default class Alert extends React.Component<IAlertProps, IAlertState> {
    private messageBox: RefObject<MessageBox>;

    constructor(props, context) {
        super(props, context);

        this.state = {
            params: null,
        };

        this.messageBox = React.createRef<MessageBox>();

        this.open = this.open.bind(this);
        this.close = this.close.bind(this);
        this.onCloseClick = this.onCloseClick.bind(this);
    }

    public render() {
        return (
            <MessageBox ref={this.messageBox}
                title={this.props.title}
                message={this.props.message}
                params={this.state.params}>
                <Button
                    autoFocus={true}
                    color={this.props.closeButtonColor || "primary"}
                    onClick={this.onCloseClick}>{this.props.closeButtonText || "OK"}
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

    private onCloseClick() {
        if (this.props.onClose) {
            this.props.onClose.apply(null, this.state.params);
        }
    }
}
