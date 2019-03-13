import React from "react";
import MessageBox from "../common/messageBox/messageBox";
import { strings } from "../../../common/strings";
import { KeyboardContext, IKeyboardContext, KeyEventType } from "../common/keyboardManager/keyboardManager";

export interface IHelpMenuProps {
    show: boolean;
    onClose?: () => void;
}

export class HelpMenu extends React.Component<IHelpMenuProps> {
    public static contextType = KeyboardContext;
    public context!: IKeyboardContext;
    
    render() {
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
        if (!registrations){
            return;
        }

        const keys = Object.keys(registrations);

        return (
            <div className="help-body">
                {
                    keys.map((key) => this.getRegistrationRow(key, registrations))
                }
            </div>
        );
    }

    private getRegistrationRow = (key, registrations) => {
        const r = registrations[key]
        return (
            <div className={"help-row"}>
                {key}
            </div>
        )
    }
}