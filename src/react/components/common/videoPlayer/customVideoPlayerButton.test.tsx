import React from "react";
import { CustomVideoPlayerButton, ICustomVideoPlayerButtonProps } from "./customVideoPlayerButton";
import { mount, ReactWrapper } from "enzyme";
import { KeyboardBinding } from "../keyboardBinding/keyboardBinding";
import { KeyboardManager, KeyEventType } from "../keyboardManager/keyboardManager";

describe("Custom Video Player Button Component", () => {
    let wrapper: ReactWrapper<ICustomVideoPlayerButtonProps> = null;
    const onClickHandler = jest.fn();
    const defaultProps: ICustomVideoPlayerButtonProps = {
        order: 8.1,
        tooltip: "Previous Tagged Frame",
        onClick: onClickHandler,
    };

    function createComponent(props?: ICustomVideoPlayerButtonProps): ReactWrapper<ICustomVideoPlayerButtonProps> {
        props = props || defaultProps;
        return mount(
            <KeyboardManager>
                <CustomVideoPlayerButton {...props}>
                    <i className="fas fas-arrow-left" />
                </CustomVideoPlayerButton>
            </KeyboardManager>,
        );
    }

    it("renders correctly", () => {
        wrapper = createComponent();
        const button = wrapper.find("button");

        expect(wrapper.find(KeyboardBinding).exists()).toBe(false);
        expect(button.exists()).toBe(true);
        expect(button.props()).toEqual(expect.objectContaining({
            type: "button",
            title: defaultProps.tooltip,
            className: "video-react-control video-react-button",
        }));
        expect(button.find("i").exists()).toBe(true);
    });

    it("renders a keyboard binding when accelerator is defined", () => {
        const props: ICustomVideoPlayerButtonProps = {
            ...defaultProps,
            accelerator: "ArrowLeft",
        };
        wrapper = createComponent(props);
        const keyboardBinding = wrapper.find(KeyboardBinding) as ReactWrapper<ICustomVideoPlayerButtonProps>;

        expect(keyboardBinding.exists()).toBe(true);
        expect(keyboardBinding.props()).toEqual({
            keyEventType: KeyEventType.KeyDown,
            accelerator: props.accelerator,
            onKeyEvent: props.onClick,
        });
    });

    it("Raises onClick handler when button is clicked", () => {
        wrapper = createComponent(defaultProps);
        wrapper.find("button").simulate("click");

        expect(onClickHandler).toBeCalled();
    });
});
