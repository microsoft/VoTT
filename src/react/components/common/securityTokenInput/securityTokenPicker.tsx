import React, { SyntheticEvent } from "react";
import { ISecurityToken } from "../../../../models/applicationState";
import { JSONSchema6 } from "json-schema";

export interface ISecurityTokenPickerProps {
    id?: string;
    schema: JSONSchema6;
    value: string;
    securityTokens: ISecurityToken[];
    onChange: (value: string) => void;
}

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
        if (!inputElement.value) {
            this.props.onChange(undefined);
        } else {
            this.props.onChange(inputElement.value);
        }
    }
}
