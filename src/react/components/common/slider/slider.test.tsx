import React from "react";
import { ISliderProps, Slider } from "./slider";
import { mount, ReactWrapper } from "enzyme";
import RcSlider from "rc-slider";

describe("Slider Component", () => {
    const onChangeHandler = jest.fn();
    const defaultProps: ISliderProps = {
        value: 80,
        onChange: onChangeHandler,
    };

    function createComponent(props?: ISliderProps): ReactWrapper<ISliderProps> {
        props = props || defaultProps;
        return mount(<Slider {...props} />);
    }

    let wrapper: ReactWrapper<ISliderProps>;

    beforeEach(() => {
        wrapper = createComponent();
    });

    it("renders correctly", () => {
        expect(wrapper.find(".slider-value").text()).toEqual(defaultProps.value.toString());
        expect(wrapper.find(RcSlider).exists()).toBe(true);
    });

    it("raises onChange handler when value has changed", () => {
        const expectedValue = 60;
        const slider = wrapper.find(RcSlider) as ReactWrapper<any>;
        slider.props().onChange(expectedValue);

        expect(onChangeHandler).toBeCalledWith(expectedValue);
    });
});
