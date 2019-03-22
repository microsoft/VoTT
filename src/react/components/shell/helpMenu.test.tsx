import { mount } from "enzyme";
import React from "react";
import MockFactory from "../../../common/mockFactory";
import { KeyboardManager } from "../common/keyboardManager/keyboardManager";
import { IKeyboardRegistrations,
    KeyboardRegistrationManager } from "../common/keyboardManager/keyboardRegistrationManager";
import { HelpMenu, IHelpMenuProps } from "./helpMenu";
jest.mock("../common/keyboardManager/keyboardRegistrationManager");

describe("Help Menu", () => {
    function createComponent(props?: IHelpMenuProps) {
        return mount(
            <KeyboardManager>
                <HelpMenu {...props}/>
            </KeyboardManager>,
        );
    }
    const numberRegistrations = 5;
    const keyboardRegistrations: IKeyboardRegistrations = MockFactory.createKeyboardRegistrations(numberRegistrations);
    const registrationMock = KeyboardRegistrationManager as jest.Mocked<typeof KeyboardRegistrationManager>;

    registrationMock.prototype.getRegistrations = jest.fn(() => keyboardRegistrations);
    registrationMock.prototype.registerBinding = jest.fn(() => jest.fn());

    it("Opens when button is clicked", () => {
        const wrapper = createComponent();
        expect(wrapper.exists("div.modal-content")).toBe(false);
        wrapper.find("div.help-menu-button").simulate("click");
        wrapper.update();
        expect(wrapper.exists("div.modal-content")).toBe(true);
    });

    it("Pulls currently registered keyboard bindings upon opening", async () => {
        const wrapper = createComponent();
        expect(wrapper.exists("div.help-key.row")).toBe(false);
        wrapper.find("div.help-menu-button").simulate("click");
        expect(wrapper.exists("div.modal-content")).toBe(true);
        expect(registrationMock.prototype.getRegistrations).toBeCalled();
        await MockFactory.flushUi();
        expect(wrapper.find("div.help-key.row")).toHaveLength(numberRegistrations);
    });

    it("Renders keyboard bindings with icon, key binding and display name", async () => {
        const wrapper = createComponent();
        wrapper.find("div.help-menu-button").simulate("click");
        await MockFactory.flushUi();
        expect(wrapper.exists(`div.col-1.keybinding-icon.fas.test-icon-1`)).toBe(true);
        expect(wrapper.find("div.col-4.keybinding-accelerator").first().text()).toEqual("A");
        expect(wrapper.find("div.col-6.keybinding-name").first().text()).toEqual("Binding 1");
    });

    it("Calls onClose handler when closed", () => {
        const onClose = jest.fn();
        const wrapper = createComponent({onClose});
        wrapper.find("div.help-menu-button").simulate("click");
        expect(wrapper.exists("div.modal-content")).toBe(true);
        wrapper.find("button.close").simulate("click");
        expect(onClose).toBeCalled();
        expect(wrapper.exists("div.modal-content")).toBe(false);
    });
});
