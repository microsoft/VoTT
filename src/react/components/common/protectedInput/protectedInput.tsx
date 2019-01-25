import React, { RefObject, SyntheticEvent } from "react";

/**
 * Protected input properties
 * @member value - The value to bind to the component
 * @member securityToken - Optional value used to encrypt/decrypt the value
 */
export interface IProtectedInputProps extends React.Props<ProtectedInput> {
    id: string;
    value: string;
    readOnly?: boolean;
    onChange: (value: string) => void;
}

/** Protected input state
 * @member showKey - Whether or not the input field renders as text or password field type
 * @member decryptedValue - The decrypted value to bind to the input field
 */
export interface IProtectedInputState {
    showKey: boolean;
    value: string;
}

/**
 * Protected input Component
 * @description - Used for sensitive fields such as passwords, keys, tokens, etc
 */
export class ProtectedInput extends React.Component<IProtectedInputProps, IProtectedInputState> {
    private inputElement: RefObject<HTMLInputElement> = React.createRef<HTMLInputElement>();

    constructor(props) {
        super(props);

        this.state = {
            showKey: false,
            value: this.props.value,
        };

        this.toggleKeyVisibility = this.toggleKeyVisibility.bind(this);
        this.copyKey = this.copyKey.bind(this);
        this.onChange = this.onChange.bind(this);
    }

    public componentDidMount() {
        this.props.onChange(this.props.value);
    }

    public render() {
        const { id, readOnly } = this.props;
        const { showKey, value } = this.state;

        return (
            <div className="input-group">
                <input id={id}
                    ref={this.inputElement}
                    type={showKey ? "text" : "password"}
                    readOnly={readOnly}
                    className="form-control"
                    value={value}
                    onChange={this.onChange} />
                <div className="input-group-append">
                    <button type="button"
                        title={showKey ? "Hide" : "Show"}
                        className="btn btn-primary btn-visibility"
                        onClick={this.toggleKeyVisibility}>
                        <i className={showKey ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                    </button>
                    <button type="button"
                        title="Copy"
                        className="btn btn-primary btn-copy"
                        onClick={this.copyKey}>
                        <i className="fas fa-copy"></i>
                    </button>
                </div>
            </div>
        );
    }

    private onChange(e: SyntheticEvent) {
        const input = e.target as HTMLInputElement;
        const value = input.value ? input.value : undefined;
        this.setState({ value }, () => this.props.onChange(value));
    }

    private toggleKeyVisibility() {
        this.setState({
            showKey: !this.state.showKey,
        });
    }

    private async copyKey() {
        const clipboard = (navigator as any).clipboard;
        await clipboard.writeText(this.inputElement.current.value);
    }
}
