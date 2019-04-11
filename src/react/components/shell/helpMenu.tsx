import React from "react";
import MessageBox from "../common/messageBox/messageBox";
import { strings } from "../../../common/strings";
import { KeyboardContext, IKeyboardContext, KeyEventType } from "../common/keyboardManager/keyboardManager";
import { IKeyboardBindingProps, KeyboardBinding } from "../common/keyboardBinding/keyboardBinding";
import "./helpMenu.scss";

export interface IHelpMenuProps {
    onClose?: () => void;
}

export interface IHelpMenuState {
    show: boolean;
}

export class HelpMenu extends React.Component<IHelpMenuProps, IHelpMenuState> {
    public static contextType = KeyboardContext;
    public context!: IKeyboardContext;

    public state = {
        show: false,
    };
    private icon: string = "fa-question-circle";

    public render() {
        return (
            <div className={"help-menu-button"} onClick={() => this.setState({show: true})}>
                <i className={`fas ${this.icon}`}/>
                <KeyboardBinding
                    displayName={strings.editorPage.help.title}
                    accelerators={["CmdOrCtrl+H", "CmdOrCtrl+h"]}
                    handler={() => this.setState({show: !this.state.show})}
                    icon={this.icon}
                    keyEventType={KeyEventType.KeyDown}
                />
                <MessageBox
                    title={strings.titleBar.help}
                    message={this.getHelpBody()}
                    show={this.state.show}
                    onCancel={this.onClose}
                    hideFooter={true}
                />
            </div>
        );
    }

    private onClose = () => {
        this.setState({show: false});
        if (this.props.onClose) {
            this.props.onClose();
        }
    }

    private getHelpBody = () => {

        const registrations = this.context.keyboard.getRegistrations()[KeyEventType.KeyDown];
        if (!registrations) {
            return;
        }

        const groupKeys = this.groupKeys(registrations);

        return (
            <div className="help-body container">
                {
                    groupKeys.map((group) => group.length ? this.getRegistrationRow(group, registrations) : null)
                }
            </div>
        );
    }

    private groupKeys = (registrations: {[key: string]: IKeyboardBindingProps}) => {
        const allKeys = Object.keys(registrations);
        const caseConsolidatedKeys = this.consolidateKeyCasings(allKeys);

        const groups = [];
        const alreadyGrouped = new Set();

        for (const key of caseConsolidatedKeys) {
            const group = [key];
            if (!alreadyGrouped.has(key)) {
                alreadyGrouped.add(key);
                for (const otherKey of caseConsolidatedKeys) {
                    if (!alreadyGrouped.has(otherKey) &&
                            this.bindingEquals(registrations[key], registrations[otherKey])) {
                        group.push(otherKey);
                        alreadyGrouped.add(otherKey);
                    }
                }
                groups.push(group);
            }
        }
        return groups;
    }

    private bindingEquals(binding1: IKeyboardBindingProps, binding2: IKeyboardBindingProps) {
        return binding1 && binding2
                && binding1.displayName === binding2.displayName
                && binding1.handler === binding2.handler;
    }

    private consolidateKeyCasings = (allKeys: string[]): string[] => {
        const lowerRegistrations = {};
        for (const key of allKeys) {
            const lowerKey = key.toLowerCase();
            if (!lowerRegistrations[lowerKey]) {
                lowerRegistrations[lowerKey] = key;
            }
        }
        return Object.keys(lowerRegistrations).map((lowerKey) => lowerRegistrations[lowerKey]);
    }

    private getRegistrationRow = (group: string[], registrations: {[key: string]: IKeyboardBindingProps}) => {
        const keyRegistration = registrations[group[0]];
        if (keyRegistration) {
            return (
                <div key={keyRegistration.displayName} className={"help-key row"}>
                    <div className={`col-1 keybinding-icon ${(keyRegistration.icon)
                        ? `fas ${keyRegistration.icon}` : ""}`}/>
                    <div className="col-4 keybinding-accelerator">{this.stringifyGroup(group)}</div>
                    <div className="col-6 keybinding-name">{keyRegistration.displayName}</div>
                </div>
            );
        }
    }

    private stringifyGroup(group: string[]): string {
        return (group.length < 3) ? group.join(", ") : `${group[0]} - ${group[group.length - 1]}`;
    }
}
