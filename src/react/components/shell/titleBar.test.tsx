import React from "react";
import { mount, ReactWrapper } from "enzyme";
import { TitleBar, ITitleBarProps, ITitleBarState } from "./titleBar";
import Menu, { MenuItem, SubMenu, Divider } from "rc-menu";

describe("TileBar Component", () => {
    let wrapper: ReactWrapper<ITitleBarProps, ITitleBarState>;
    const defaultProps: ITitleBarProps = {
        title: "Test Title",
        icon: "fas fa-tags",
    };

    let handlerMapping = {};

    const mockMenu: any = {
        items: [{
            label: "Top Level Menu",
            type: "submenu",
            visible: true,
            enabled: true,
            submenu: {
                items: [
                    {
                        label: "Normal Item", accelerator: "CmdOrCtrl+O",
                        click: jest.fn(), visible: true, enabled: true, type: "normal",
                    },
                    { type: "separator", visible: true, enabled: true },
                    { label: "Checkbox Item", type: "checkbox", checked: true, visible: true, enabled: true },
                    { label: "Disabled Item", enabled: false, visible: true, type: "normal" },
                    { label: "Invisible Item", visible: false, enabled: true, type: "normal" },
                    { label: "Role Item", role: "quit", visible: true, enabled: true, type: "normal" },
                ],
            },
        }],
    };

    const electronCurrentWindow = {
        on: jest.fn((evt, handler) => {
            handlerMapping[evt] = handler;
        }),
        isMaximized: jest.fn(() => false),
        isFullScreen: jest.fn(() => false),
        setTitle: jest.fn(),
        minimize: jest.fn(),
        maximize: jest.fn(),
        unmaximize: jest.fn(),
        close: jest.fn(),
    };

    const electronMock = {
        remote: {
            getCurrentWindow: jest.fn(() => electronCurrentWindow),
            Menu: {
                getApplicationMenu: jest.fn(() => mockMenu),
            },
        },
    };

    function createComponent(props?: ITitleBarProps): ReactWrapper<ITitleBarProps, ITitleBarState> {
        props = props || defaultProps;
        return mount(
            <TitleBar {...props}>
                <ul>
                    <li>
                        <a title="Profile" href="#/profile">
                            <i className="fas fa-user-circle"></i>
                        </a>
                    </li>
                </ul>
            </TitleBar>,
        );
    }

    beforeEach(() => {
        handlerMapping = {};
        wrapper = createComponent();
    });

    describe("Web", () => {
        beforeAll(() => {
            window["require"] = undefined;
            Object.defineProperty(global.process, "platform", {
                value: undefined,
            });
        });

        it("renders ico, title and children", () => {
            const icon = wrapper.find(".title-bar-icon");
            const title = wrapper.find(".title-bar-main");

            expect(icon.exists()).toBe(true);
            expect(icon.find(".fa-tags").exists()).toBe(true);
            expect(title.exists()).toBe(true);
            expect(title.text()).toEqual(`${defaultProps.title} - VoTT`);
            expect(wrapper.find(".fa-user-circle").exists()).toBe(true);
        });
    });

    describe("Electron", () => {
        beforeAll(() => {
            (window as any)["require"] = jest.fn(() => electronMock);
        });

        describe("Windows", () => {
            beforeAll(() => {
                Object.defineProperty(global.process, "platform", {
                    value: "win32",
                });
            });

            it("renders icon, menu, title, children and window controls", () => {
                expect(wrapper.find(".title-bar-icon").exists()).toBe(true);
                expect(wrapper.find(".title-bar-menu").exists()).toBe(true);
                expect(wrapper.find(".title-bar-main").exists()).toBe(true);
                expect(wrapper.find(".btn-window-minimize").exists()).toBe(true);
                expect(wrapper.find(".btn-window-maximize").exists()).toBe(true);
                expect(wrapper.find(".btn-window-close").exists()).toBe(true);
                expect(wrapper.find(".fa-user-circle").exists()).toBe(true);
            });

            it("renders correct menu item", () => {
                wrapper.find(".rc-menu-submenu-title").at(1).simulate("click");
                wrapper.update();

                expect(wrapper.find(Menu).exists()).toBe(true);
                expect(wrapper.find(SubMenu).exists()).toBe(true);
                expect(wrapper.find(Divider).exists()).toBe(true);
                expect(wrapper.find(MenuItem).exists()).toBe(true);
            });

            it("calls menu item click method when selected", () => {
                const expectedMenuItem = mockMenu.items[0].submenu.items[0];

                wrapper.find(".rc-menu-submenu-title").at(1).simulate("click");
                wrapper.update();

                wrapper.find(".rc-menu-item").first().simulate("click");
                expect(expectedMenuItem.click).toBeCalledWith(expectedMenuItem, electronCurrentWindow);
            });

            it("does not render when in full screen mode", () => {
                expect(wrapper.find(".title-bar").exists()).toBe(true);

                // Trigger full screen
                wrapper.setState({ fullscreen: true });

                expect(wrapper.find(".title-bar").exists()).toBe(false);
            });

            it("does not render maximize button when window is maximized", () => {
                expect(wrapper.find(".btn-window-maximize").exists()).toBe(true);
                expect(wrapper.find(".btn-window-restore").exists()).toBe(false);

                // Maximize Window
                wrapper.setState({ maximized: true });

                expect(wrapper.find(".btn-window-maximize").exists()).toBe(false);
                expect(wrapper.find(".btn-window-restore").exists()).toBe(true);

                // Restore Window
                wrapper.setState({ maximized: false });

                expect(wrapper.find(".btn-window-maximize").exists()).toBe(true);
                expect(wrapper.find(".btn-window-restore").exists()).toBe(false);
            });

            it("Updates title when props change", () => {
                const updatedTitle = "Updated Title";
                const expectedTitleString = `${updatedTitle} - VoTT`;
                wrapper.setProps({ title: updatedTitle });
                expect(wrapper.find(".title-bar-main").text()).toEqual(expectedTitleString);
                expect(electronCurrentWindow.setTitle).toBeCalledWith(expectedTitleString);
            });

            it("clicking minimize button minimizes window", () => {
                wrapper.find(".btn-window-minimize").simulate("click");
                expect(electronCurrentWindow.minimize).toBeCalled();
            });

            it("clicking maximize button maximizes window", () => {
                wrapper.find(".btn-window-maximize").simulate("click");
                expect(electronCurrentWindow.maximize).toBeCalled();
            });

            it("clicking restore button restores window to previous size", () => {
                wrapper.setState({ maximized: true });

                wrapper.find(".btn-window-restore").simulate("click");
                expect(electronCurrentWindow.unmaximize).toBeCalled();
            });

            it("clicking close button closes window", () => {
                wrapper.find(".btn-window-close").simulate("click");
                expect(electronCurrentWindow.close).toBeCalled();
            });

            it("maximize event set maximized state", () => {
                expect(wrapper.state().maximized).toBe(false);
                handlerMapping["maximize"]();
                expect(wrapper.state().maximized).toBe(true);
            });

            it("unmaximize event sets maximized state", () => {
                expect(wrapper.state().maximized).toBe(false);
                handlerMapping["maximize"]();
                expect(wrapper.state().maximized).toBe(true);
                handlerMapping["unmaximize"]();
                expect(wrapper.state().maximized).toBe(false);
            });

            it("enter-full-screen event sets fullscreen state", () => {
                expect(wrapper.state().fullscreen).toBe(false);
                handlerMapping["enter-full-screen"]();
                expect(wrapper.state().fullscreen).toBe(true);
            });

            it("leave-full-screen event sets fullscreen state", () => {
                expect(wrapper.state().fullscreen).toBe(false);
                handlerMapping["enter-full-screen"]();
                expect(wrapper.state().fullscreen).toBe(true);
                handlerMapping["leave-full-screen"]();
                expect(wrapper.state().fullscreen).toBe(false);
            });
        });

        describe("MacOS", () => {
            beforeAll(() => {
                Object.defineProperty(global.process, "platform", {
                    value: "darwin",
                });
            });

            it("renders title and children", () => {
                expect(wrapper.find(".title-bar-icon").exists()).toBe(false);
                expect(wrapper.find(".title-bar-menu").exists()).toBe(false);
                expect(wrapper.find(".title-bar-main").exists()).toBe(true);
                expect(wrapper.find(".btn-window-minimize").exists()).toBe(false);
                expect(wrapper.find(".btn-window-maximize").exists()).toBe(false);
                expect(wrapper.find(".btn-window-close").exists()).toBe(false);
                expect(wrapper.find(".fa-user-circle").exists()).toBe(true);
            });
        });

        describe("Linux", () => {
            beforeAll(() => {
                Object.defineProperty(global.process, "platform", {
                    value: "linux",
                });
            });

            it("renders title and children", () => {
                expect(wrapper.find(".title-bar-icon").exists()).toBe(false);
                expect(wrapper.find(".title-bar-menu").exists()).toBe(false);
                expect(wrapper.find(".title-bar-main").exists()).toBe(true);
                expect(wrapper.find(".btn-window-minimize").exists()).toBe(false);
                expect(wrapper.find(".btn-window-maximize").exists()).toBe(false);
                expect(wrapper.find(".btn-window-close").exists()).toBe(false);
                expect(wrapper.find(".fa-user-circle").exists()).toBe(true);
            });
        });
    });
});
