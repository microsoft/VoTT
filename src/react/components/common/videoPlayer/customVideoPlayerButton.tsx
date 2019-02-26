import React, { Fragment } from "react";
import { Player } from "video-react";
import { KeyboardBinding } from "../keyboardBinding/keyboardBinding";
import { KeyEventType } from "../keyboardManager/keyboardManager";

export interface ICustomVideoPlayerButtonProps {
    order: number;
    accelerators?: string[];
    tooltip?: string;
    player?: Player;
    keyboardEnabled?: boolean;
    onClick: () => void;
}

export class CustomVideoPlayerButton extends React.Component<ICustomVideoPlayerButtonProps> {
    public render() {
        const keyboardEnabled = { ...this.props } || false;

        return (
            <Fragment>
                {keyboardEnabled && this.props.accelerators &&
                    <KeyboardBinding keyEventType={KeyEventType.KeyDown}
                        accelerators={this.props.accelerators}
                        onKeyEvent={this.props.onClick} />
                }
                <button
                    type="button"
                    title={this.props.tooltip}
                    className="video-react-control video-react-button"
                    onClick={this.props.onClick}>
                    {this.props.children}
                </button>
            </Fragment>
        );
    }
}
