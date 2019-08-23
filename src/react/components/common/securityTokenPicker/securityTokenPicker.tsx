import React, { SyntheticEvent } from "react";
import { ISecurityToken } from "../../../../models/applicationState";
import { connect } from "react-redux";

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
    onCheckChange: (value: boolean) => void;
    isSecure: boolean;
}

export interface ISecurityTokenPickerState {
    isEnabled: boolean;
}

function mapStateToProps(state: ISecurityTokenPickerState) {
    return {
        isSecure: state.isEnabled,
    };
}

/**
 * Security Token Picker
 * @description - Used to display a list of security tokens
 */
@connect(mapStateToProps)
export class SecurityTokenPicker extends React.Component<ISecurityTokenPickerProps, ISecurityTokenPickerState> {
    constructor(props) {
        super(props);

        this.state = {isEnabled: props.isSecure};

        this.onChange = this.onChange.bind(this);
    }

    public render() {
        return (
            <select id={this.props.id}
                className="form-control"
                value={this.props.value}
                onChange={this.onChange}
                disabled={!this.state.isEnabled}>
                <option value="">Generate New Security Token</option>
                {this.props.securityTokens.map((item) => <option key={item.key} value={item.name}>{item.name}</option>)}
            </select>
        );
    }

    private onChange(e: SyntheticEvent) {
        const inputElement = e.target as HTMLSelectElement;
        this.props.onChange(inputElement.value ? inputElement.value : undefined);
    }

    private onCheckChange(e: SyntheticEvent) {
        this.props.onCheckChange(!this.state.isEnabled);
        this.setState({isEnabled: !this.state.isEnabled});
    }
}
