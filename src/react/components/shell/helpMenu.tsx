import React from "react";
import MessageBox from "../common/messageBox/messageBox";
import { strings } from "../../../common/strings";
import { KeyboardContext, IKeyboardContext, KeyEventType } from "../common/keyboardManager/keyboardManager";
import { IKeyboardBindingProps } from "../common/keyboardBinding/keyboardBinding";
import "./helpMenu.scss";

export interface IHelpMenuProps {
    show: boolean;
    onClose?: () => void;
}

export class HelpMenu extends React.Component<IHelpMenuProps> {
    public static contextType = KeyboardContext;
    public context!: IKeyboardContext;

    public render() {
        return (
            <div className={"help-modal"}>
                <MessageBox
                    title={strings.titleBar.help}
                    message={this.getHelpBody()}
                    show={this.props.show}
                    onCancel={this.props.onClose}
                    hideFooter={true}
                />
            </div>
        );
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

    private groupKeys = (registrations: {[key: string]: IKeyboardBindingProps[]}) => {
        const keys = this.consolidateKeyCasings(registrations);

        const groups = [];
        const alreadyGrouped = new Set();

        for (const key of keys) {
            const group = [key];
            if (!alreadyGrouped.has(key)) {
                alreadyGrouped.add(key);
                for (const otherKey of keys) {
                    if (!alreadyGrouped.has(otherKey) &&
                            this.handlerEquals(registrations[key], registrations[otherKey])) {
                        group.push(otherKey);
                        alreadyGrouped.add(otherKey);
                    }
                }
                groups.push(group);
            }
        }
        return groups;
    }

    private handlerEquals(reg1: IKeyboardBindingProps[], reg2: IKeyboardBindingProps[]) {
        return reg1[0] && reg2[0] && reg1[0].handler === reg2[0].handler;
    }

    private consolidateKeyCasings = (registrations: {[key: string]: IKeyboardBindingProps[]}): string[] => {
        const allKeys = Object.keys(registrations);
        const lowerRegistrations = {};
        for (const key of allKeys) {
            const lowerKey = key.toLowerCase();
            if (!lowerRegistrations[lowerKey]) {
                lowerRegistrations[lowerKey] = key;
            }
        }
        return Object.keys(lowerRegistrations).map((lowerKey) => lowerRegistrations[lowerKey]);
    }

    private getRegistrationRow = (group: string[], registrations: {[key: string]: IKeyboardBindingProps[]}) => {
        // At the moment, there are no keys "doubled up". We are getting the first registration for the key
        const keyRegistration = registrations[group[0]][0];
        if (keyRegistration) {
            return (
                <div className={"help-key row"}>
                    <div className={`col-1 keybinding-icon ${(keyRegistration.icon)
                        ? `fas ${keyRegistration.icon}` : ""}`}/>
                    <div className="col-4 keybinding">{this.stringifyGroup(group)}</div>
                    <div className="col-6">{keyRegistration.displayName}</div>
                </div>
            );
        }
    }

    private stringifyGroup(group: string[]): string {
        return (group.length < 3) ? group.join(", ") : `${group[0]}-${group[group.length - 1]}`;
    }
}
