import React, { Fragment } from "react";
import { Player } from "video-react";
import { KeyboardBinding } from "../keyboardBinding/keyboardBinding";
import { KeyEventType } from "../keyboardManager/keyboardManager";

export interface ICustomVideoPlayerButtonProps {
    order: number;
    onClick: () => void;
    icon?: string;
    accelerators?: string[];
    tooltip?: string;
    player?: Player;
}

export class CustomVideoPlayerButton extends React.Component<ICustomVideoPlayerButtonProps> {
    public render() {
        return (
            <Fragment>
                {this.props.accelerators &&
                    <KeyboardBinding keyEventType={KeyEventType.KeyDown}
                        name={this.props.tooltip}
                        accelerators={this.props.accelerators}
                        handler={this.props.onClick} />
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
