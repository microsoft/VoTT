import React from "react";
import Menu, { MenuItem, SubMenu, Divider } from "rc-menu";
import "./titleBar.scss";

export interface ITitleBarProps extends React.Props<TitleBar> {
    title?: string;
    menu?: any;
}

export interface ITitleBarState {
    isElectron: boolean;
    maximized: boolean;
    minimized: boolean;
    menu: Electron.Menu;
}

export class TitleBar extends React.Component<ITitleBarProps, ITitleBarState> {
    public state: ITitleBarState = {
        isElectron: false,
        maximized: false,
        minimized: false,
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

            this.setState({
                isElectron: true,
                minimized: this.currentWindow.isMinimized(),
                maximized: this.currentWindow.isMaximized(),
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
        return (
            <div className="title-bar bg-lighter-3">
                <div className="title-bar-icon">
                    <i className="fas fa-tags"></i>
                </div>
                <div className="title-bar-menu">
                    {this.state.isElectron &&
                        <Menu ref={this.menu}
                            mode="horizontal"
                            selectable={false}
                            triggerSubMenuAction="click"
                            onClick={this.onMenuItemSelected}>
                            {this.renderMenu(this.state.menu)}
                        </Menu>
                    }
                </div>
                <div className="title-bar-main">{this.props.title || "Welcome"} - VoTT</div>
                <div className="title-bar-controls">
                    {this.state.isElectron &&
                        <ul>
                            <li title="Minimize" className="btn-window-minimize" onClick={this.minimizeWindow}>
                                <i className="far fa-window-minimize" />
                            </li>
                            {!this.state.maximized &&
                                <li title="Maximize" className="btn-window-maximize" onClick={this.maximizeWindow}>
                                    <i className="far fa-window-maximize" />
                                </li>
                            }
                            {this.state.maximized &&
                                <li title="Restore" className="btn-window-restore" onClick={this.restoreWindow}>
                                    <i className="far fa-window-restore" />
                                </li>
                            }
                            <li title="Close" className="btn-window-close" onClick={this.closeWindow}>
                                <i className="fas fa-times" />
                            </li>
                        </ul>
                    }
                </div>
            </div>
        );
    }

    private renderMenu = (menu: Electron.Menu) => {
        if (!menu) {
            return null;
        }

        return menu.items.map(this.renderMenuItem);
    }

    private renderMenuItem = (menuItem: Electron.MenuItem) => {
        const itemType: string = menuItem["type"];
        console.log(itemType);

        switch (itemType) {
            case "submenu":
                return (
                    <SubMenu title={menuItem.label} key={menuItem.label} popupOffset={[0, 0]}>
                        {this.renderMenu(menuItem["submenu"])}
                    </SubMenu>
                );
            case "separator":
                return (<Divider />);
            case "normal":
                return (
                    <MenuItem key={menuItem.label} onClick={(e) => this.onMenuItemClick(e, menuItem)}>
                        <div className="menu-item-container">
                            <div className="menu-item-label">{menuItem.label}{menuItem["sublabel"]}</div>
                            <div className="menu-item-accelerator">{menuItem["accelerator"]}</div>
                        </div>
                    </MenuItem>
                );
        }
    }

    private onMenuItemClick(e: any, menuItem: Electron.MenuItem) {
        if (menuItem.click) {
            menuItem.click.call(menuItem, menuItem, this.currentWindow);
        }
    }

    private syncTitle = (): void => {
        if (this.state.isElectron) {
            this.currentWindow.setTitle(`${this.props.title} - VoTT`);
        }
    }

    private minimizeWindow = () => {
        this.currentWindow.minimize();
        this.setState({ minimized: true });
    }

    private maximizeWindow = () => {
        this.currentWindow.maximize();
        this.setState({ maximized: true, minimized: false });
    }

    private restoreWindow = () => {
        this.currentWindow.restore();
        this.setState({ maximized: false, minimized: false });
    }

    private closeWindow = () => {
        this.remote.getCurrentWindow().close();
    }

    private onMenuItemSelected = (key: string, item: React.Component) => {
        this.menu.current.store.setState({
            openKeys: [],
            selectedKeys: [],
        });
    }
}
