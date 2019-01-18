import React from "react";
import { FieldProps } from "react-jsonschema-form";

export interface ISecurityTokenInputProps extends FieldProps {
}

export function SecurityTokenInput(props: ISecurityTokenInputProps) {
    const { id, onChange, value } = props;

    return (
        <div className="input-group">
            <input id={id}
                type="text"
                readOnly={true}
                className="form-control"
                value={value}
                onChange={(e) => onChange(e.target.value)} />
            <div className="input-group-append">
                <button type="button" className="btn btn-primary">
                    <i className="fas fa-unlock"></i>
                </button>
                <button type="button" className="btn btn-primary">
                    <i className="fas fa-sync-alt"></i>
                </button>
            </div>
        </div>
    );
}
