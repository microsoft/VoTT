import React from "react";
import { GithubPicker, CirclePicker } from "react-color";

export interface IColorPickerProps {
    show: boolean;
    color: string;
    colors: string[];
    onEditColor: (color: string) => void;
}

export class ColorPicker extends React.Component<IColorPickerProps> {

    private pickerBackground = "#252526";

    public render() {
        return (
            this.props.show &&
            this.GithubPicker()
        );
    }

    private onChange = (color) => {
        this.props.onEditColor(color.hex);
    }

    private GithubPicker = () => {
        return (
            <GithubPicker
                color={{hex: this.props.color}}
                onChangeComplete={this.onChange}
                colors={this.props.colors}
                width={160}
                styles={{
                    default: {
                        card: {
                            background: this.pickerBackground,
                        },
                    },
                }}
                triangle={"hide"}
            />
        );
    }

    private CirclePicker = () => {
        return (
            <div className="circle-picker-container">
                <CirclePicker
                    width={200}
                    onChange={this.onChange}
                    colors={this.props.colors}
                    hex={this.props.color}
                    circleSize={25}
                />
            </div>

        );
    }
}
