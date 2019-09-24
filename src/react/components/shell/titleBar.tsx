import React, { Fragment } from "react";
import Menu, { MenuItem, SubMenu, Divider } from "rc-menu";
import { PlatformType } from "../../../common/hostProcess";
import "./titleBar.scss";
import { strings } from "../../../common/strings";
import { HelpMenu } from "./helpMenu";

export interface ITitleBarProps extends React.Props<TitleBar> {
    icon?: string | JSX.Element;
    title?: string;
    fullName?: string;
}

export interface ITitleBarState {
    isElectron: boolean;
    platform: string;
    maximized: boolean;
    fullscreen: boolean;
    menu: Electron.Menu;
}

export class TitleBar extends React.Component<ITitleBarProps, ITitleBarState> {
    public state: ITitleBarState = {
        isElectron: false,
        platform: global && global.process && global.process.platform ? global.process.platform : "web",
        maximized: false,
        fullscreen: false,
        menu: null,
    };

    private menu: Menu = React.createRef();
    private remote: Electron.Remote;
    private currentWindow: Electron.BrowserWindow;

    public componentDidMount() {
        const isElectron: boolean = !!window["require"];

        if (isElectron) {
            this.remote = (window as any).require("electron").remote as Electron.Remote;
            this.currentWindow = this.remote.getCurrentWindow();

            this.currentWindow.on("maximize", () => this.onMaximize(true));
            this.currentWindow.on("unmaximize", () => this.onMaximize(false));
            this.currentWindow.on("enter-full-screen", () => this.onFullScreen(true));
            this.currentWindow.on("leave-full-screen", () => this.onFullScreen(false));

            this.setState({
                isElectron: true,
                maximized: this.currentWindow.isMaximized(),
                fullscreen: this.currentWindow.isFullScreen(),
                menu: this.remote.Menu.getApplicationMenu(),
            });
        }
    }

    public componentDidUpdate(prevProps: Readonly<ITitleBarProps>) {
        if (this.props.title !== prevProps.title) {
            this.syncTitle();
        }
    }

    public render() {
        if (this.state.fullscreen) {
            return null;
        }
        const {fullName} = this.props;

        return (
            <div className="title-bar bg-lighter-3">
                {(this.state.platform === PlatformType.Windows || this.state.platform === PlatformType.Web) &&
                    <div className="title-bar-icon">
                        {typeof (this.props.icon) === "string" && <i className={`${this.props.icon}`}></i>}
                        {typeof (this.props.icon) !== "string" && this.props.icon}
                    </div>
                }
                {this.state.platform === PlatformType.Windows &&
                    <div className="title-bar-menu">
                        <Menu ref={this.menu}
                            mode="horizontal"
                            selectable={false}
                            triggerSubMenuAction="click"
                            onClick={this.onMenuItemSelected}>
                            {this.renderMenu(this.state.menu)}
                        </Menu>
                    </div>
                }
                <div className="title-bar-main">{this.props.title || "Welcome"} - VoTT</div>
                {fullName &&
                <div className="title-bar-user-full-name">
                   {fullName}
                </div>
                }
                <div className="title-bar-controls">
                    {this.props.children}
                    {this.state.platform === PlatformType.Windows &&
                        <ul>
                            <li title={strings.titleBar.minimize} className="btn-window-minimize"
                                    onClick={this.minimizeWindow}>
                                <i className="far fa-window-minimize" />
                            </li>
                            {!this.state.maximized &&
                                <li title={strings.titleBar.maximize} className="btn-window-maximize"
                                        onClick={this.maximizeWindow}>
                                    <i className="far fa-window-maximize" />
                                </li>
                            }
                            {this.state.maximized &&
                                <li title={strings.titleBar.restore} className="btn-window-restore"
                                        onClick={this.unmaximizeWindow}>
                                    <i className="far fa-window-restore" />
                                </li>
                            }
                            <li title={strings.titleBar.close} className="btn-window-close"
                                    onClick={this.closeWindow}>
                                <i className="fas fa-times" />
                            </li>
                        </ul>
                    }
                </div>
            </div>
        );
    }

    private onMaximize = (isMaximized: boolean) => {
        this.setState({
            maximized: isMaximized,
        });
    }

    private onFullScreen = (isFullScreen: boolean) => {
        this.setState({
            fullscreen: isFullScreen,
        });
    }

    private renderMenu = (menu: Electron.Menu) => {
        if (!menu) {
            return null;
        }

        return menu.items.map(this.renderMenuItem);
    }

    private renderMenuItem = (menuItem: Electron.MenuItem, index: number) => {
        if (!menuItem.visible) {
            return null;
        }

        const itemType: string = menuItem["type"];

        switch (itemType) {
            case "submenu":
                return (
                    <SubMenu title={menuItem.label} key={menuItem.label} popupOffset={[0, 0]}>
                        {this.renderMenu(menuItem["submenu"])}
                    </SubMenu>
                );
            case "separator":
                return (<Divider key={index} />);
            case "checkbox":
                return (
                    <MenuItem key={menuItem.label}
                        disabled={!menuItem.enabled}
                        onClick={(e) => this.onMenuItemClick(e, menuItem)}>
                        <div className="menu-item-container">
                            {Boolean(menuItem.checked) &&
                                <div className="menu-item-checkbox">
                                    <i className="fas fa-check" />
                                </div>
                            }
                            <div className="menu-item-label">{menuItem.label}{menuItem["sublabel"]}</div>
                            <div className="menu-item-accelerator">{this.getAcceleratorString(menuItem)}</div>
                        </div>
                    </MenuItem>);
            case "normal":
                return (
                    <MenuItem key={menuItem.label}
                        disabled={!menuItem.enabled}
                        onClick={(e) => this.onMenuItemClick(e, menuItem)}>
                        <div className="menu-item-container">
                            <div className="menu-item-label">{menuItem.label}{menuItem["sublabel"]}</div>
                            <div className="menu-item-accelerator">{this.getAcceleratorString(menuItem)}</div>
                        </div>
                    </MenuItem>
                );
        }
    }

    private onMenuItemClick(e: any, menuItem: Electron.MenuItem) {
        if (menuItem.click) {
            menuItem.click.call(menuItem, menuItem, this.currentWindow);
        }

        this.setState({ menu: { ...this.state.menu } as Electron.Menu });
    }

    private syncTitle = (): void => {
        if (this.state.isElectron) {
            this.currentWindow.setTitle(`${this.props.title} - VoTT`);
        }
    }

    private minimizeWindow = () => {
        this.currentWindow.minimize();
    }

    private maximizeWindow = () => {
        this.currentWindow.maximize();
    }

    private unmaximizeWindow = () => {
        this.currentWindow.unmaximize();
    }

    private closeWindow = () => {
        this.currentWindow.close();
    }

    private onMenuItemSelected = (key: string, item: React.Component) => {
        // Required to auto-close the menu after user selects an item.
        this.menu.current.store.setState({
            openKeys: [],
            selectedKeys: [],
        });
    }

    private getAcceleratorString(menuItem: Electron.MenuItem) {
        const accelerator = menuItem["accelerator"] || this.getAcceleratorFromRole(menuItem["role"]);
        if (accelerator) {
            return accelerator.replace("CmdOrCtrl", "Ctrl");
        }

        return null;
    }

    private getAcceleratorFromRole(role: string) {
        switch (role) {
            case "undo":
                return "CmdOrCtrl+Z";
            case "redo":
                return "CmdOrCtrl+Y";
            case "cut":
                return "CmdOrCtrl+X";
            case "copy":
                return "CmdOrCtrl+C";
            case "paste":
                return "CmdOrCtrl+V";
            case "selectall":
                return "CmdOrCtrl+A";
            case "minimize":
                return "CmdOrCtrl+M";
            case "close":
                return "CmdOrCtrl+W";
            case "quit":
                return "CmdOrCtrl+Q";
            case "reload":
                return "CmdOrCtrl+R";
            case "togglefullscreen":
                return "F11";
            case "toggledevtools":
                return "CmdOrCtrl+Shift+I";
            case "resetzoom":
                return "CmdOrCtrl+0";
            case "zoomin":
                return "CmdOrCtrl+Shift+=";
            case "zoomout":
                return "CmdOrCtrl+-";
        }
    }
}
