import React, { SyntheticEvent } from "react";
import { ISecurityToken } from "../../../../models/applicationState";

/**
 * Security Token Picker Properties
 * @member id - The id to bind to the input element
 * @member value - The value to bind to the input element
 * @member securityTokens - The list of security tokens to display
 * @member onChange - The event handler to call when the input value changes
 */
export interface ISecurityTokenPickerProps {
    id?: string;
    value: string;
    securityTokens: ISecurityToken[];
    onChange: (value: string) => void;
}

/**
 * Security Token Picker
 * @description - Used to display a list of security tokens
 */
export class SecurityTokenPicker extends React.Component<ISecurityTokenPickerProps> {
    constructor(props) {
        super(props);

        this.onChange = this.onChange.bind(this);
    }

    public render() {
        return (
            <select id={this.props.id}
                className="form-control"
                value={this.props.value}
                onChange={this.onChange}>
                <option value="">Generate New Security Token</option>
                {this.props.securityTokens.map((item) => <option key={item.key} value={item.name}>{item.name}</option>)}
            </select>
        );
    }

    private onChange(e: SyntheticEvent) {
        const inputElement = e.target as HTMLSelectElement;
        this.props.onChange(inputElement.value ? inputElement.value : undefined);
    }
}
