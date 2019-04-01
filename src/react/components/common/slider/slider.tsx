import React from "react";
import RcSlider from "rc-slider";
import "rc-slider/assets/index.css";

export interface ISliderProps {
    value: number;
    min?: number;
    max?: number;
    onChange: (value) => void;
    disabled?: boolean;
}

/**
 * Slider component to select a value between a min / max range
 */
export class Slider extends React.Component<ISliderProps> {
    public render() {
        return (
            <div className="slider">
                <span className="slider-value">{this.props.value}</span>
                <RcSlider {...this.props} />
            </div>
        );
    }
}
