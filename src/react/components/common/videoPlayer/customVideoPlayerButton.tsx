import React, { Fragment } from "react";
import { Player } from "video-react";
import { KeyboardBinding } from "../keyboardBinding/keyboardBinding";

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
                    <KeyboardBinding accelerator={this.props.accelerator} onKeyDown={this.props.onClick} />
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
