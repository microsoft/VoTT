import React, { SyntheticEvent } from "react";
import { FieldProps } from "react-jsonschema-form";
import { generateKey } from "../../../../common/crypto";

export interface ISecurityTokenInputProps extends FieldProps {
}

export function SecurityTokenInput(props: ISecurityTokenInputProps) {
    const inputRef = React.createRef<HTMLInputElement>();
    let { id, onChange, value } = props;

    if (!value) {
        value = generateKey();
        onChange(value);
    }

    function toggleInputType() {
        const newType = inputRef.current.type === "password" ? "text" : "password";
        inputRef.current.type = newType;
    }

    return (
        <div className="input-group">
            <input id={id}
                ref={inputRef}
                type="password"
                readOnly={true}
                className="form-control"
                value={value}
                onChange={(e) => onChange(e.target.value)} />
            <div className="input-group-append">
                <button type="button"
                    className="btn btn-primary"
                    onClick={toggleInputType}>
                    <i className="fas fa-unlock"></i>
                </button>
                <button type="button" className="btn btn-primary">
                    <i className="fas fa-sync-alt"></i>
                </button>
            </div>
        </div>
    );
}
