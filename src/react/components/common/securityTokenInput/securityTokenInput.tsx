import React, { RefObject } from "react";
import { FieldProps } from "react-jsonschema-form";
import { generateKey } from "../../../../common/crypto";

export interface ISecurityTokenInputState {
    showKey: boolean;
    value: string;
}

export class SecurityTokenInput extends React.Component<FieldProps, ISecurityTokenInputState> {
    private inputElement: RefObject<HTMLInputElement> = React.createRef<HTMLInputElement>();

    constructor(props) {
        super(props);

        this.state = {
            showKey: false,
            value: this.props.value || "",
        };

        this.toggleKeyVisibility = this.toggleKeyVisibility.bind(this);
        this.copyKey = this.copyKey.bind(this);
    }

    public componentDidMount() {
        if (!this.state.value) {
            this.setState({
                value: generateKey(),
            }, () => {
                this.props.onChange(this.state.value);
            });
        }
    }

    public render() {
        const { id, onChange } = this.props;
        const { showKey, value } = this.state;

        return (
            <div className="input-group">
                <input id={id}
                    ref={this.inputElement}
                    type={showKey ? "text" : "password"}
                    readOnly={true}
                    className="form-control"
                    value={value}
                    onChange={(e) => onChange(e.target.value)} />
                <div className="input-group-append">
                    <button type="button"
                        title={showKey ? "Hide" : "Show"}
                        className="btn btn-primary"
                        onClick={this.toggleKeyVisibility}>
                        <i className={showKey ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                    </button>
                    <button type="button"
                        title="Copy"
                        className="btn btn-primary"
                        onClick={this.copyKey}>
                        <i className="fas fa-copy"></i>
                    </button>
                </div>
            </div>
        );
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
