import React from "react";
import { GithubPicker } from "react-color";

export interface IColorPickerProps {
    show: boolean;
    // coordinates: {top: number, left: number};
    color: string;
    colors: string[];
    onEditColor: (color: string) => void;
    width?: number;
}

export class ColorPicker extends React.Component<IColorPickerProps> {

    private pickerBackground = "#252526";

    public render() {
        // const {top, left} = this.props.coordinates;
        return (
            this.props.show &&
            this.GithubPicker()
        );
    }

    private GithubPicker = () => {
        return <GithubPicker
            color={{hex: this.props.color}}
            onChangeComplete={(color) => this.props.onEditColor(color.hex)}
            colors={this.props.colors}
            width={this.props.width}
            styles={{
                default: {
                    card: {
                        background: this.pickerBackground,
                    },
                },
            }}
            triangle={"hide"}
        />;
    }
}
