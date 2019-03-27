import React from "react";
import { GithubPicker } from "react-color"

export interface IColorPickerProps {
    show: boolean;
    coordinates: {top: number, left: number}
    color: string;
    colors: string[];
    onEditColor: (color: string) => void;
    width?: number;
}

export class ColorPicker extends React.Component<IColorPickerProps> {

    render() {
        const {top, left} = this.props.coordinates
        return (
            this.props.show && 
            <div className="tag-color-picker" style={{
                position: "absolute",
                top: `${top}px`,
                left: `${left}px`,
                zIndex: 1,
            }}>
                <GithubPicker
                    color={{hex: this.props.color}}
                    onChangeComplete={(color) => this.props.onEditColor(color.hex)}
                    colors={this.props.colors}
                    triangle={"top-right"}
                    width={this.props.width}
                    styles={{
                        default: {
                            card: {
                                background: "#123"
                            },
                            triangle: {
                                borderBottomColor: "#123",
                            }
                        }
                    }}
                />
            </div>
        );
    }
}