import React, { Fragment } from "react";
import { Player } from "video-react";
import { KeyboardBinding } from "../keyboardBinding/keyboardBinding";
import { KeyEventType } from "../keyboardManager/keyboardManager";

export interface ICustomVideoPlayerButtonProps {
    order: number;
    accelerator?: string;
    tooltip?: string;
    player?: Player;
    onClick: () => void;
}

export class CustomVideoPlayerButton extends React.Component<ICustomVideoPlayerButtonProps> {
    public render() {
        return (
            <Fragment>
                {this.props.accelerator &&
                    <KeyboardBinding keyEventType={KeyEventType.KeyDown}
                        accelerator={this.props.accelerator}
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
