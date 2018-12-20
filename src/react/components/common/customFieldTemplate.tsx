import React from "react";

export default function CustomFieldTemplate(props) {
    const { id, label, help, required, description, errors, rawErrors, children } = props;
    const classNames = ["form-group"];
    if (rawErrors && rawErrors.length > 0) {
        classNames.push("is-invalid");
    } else {
        classNames.push("is-valid");
    }

    return (
        <div className={classNames.join(" ")}>
            <label htmlFor={id}>{label}{required ? "*" : null}</label>
            {children}
            {description && <small className="text-muted">{description}</small>}
            {rawErrors && rawErrors.length > 0 &&
                <div className="invalid-feedback">
                    {rawErrors.map((errorMessage, idx) => <div key={idx}>{label} {errorMessage}</div>)}
                </div>
            }
        </div>
    );
}
