import React from "react";
import { FieldTemplateProps } from "react-jsonschema-form";

export default function CustomFieldTemplate(props: FieldTemplateProps) {
    const { id, label, required, description, rawErrors, children } = props;
    const classNames = ["form-group"];
    if (rawErrors && rawErrors.length > 0) {
        classNames.push("is-invalid");
    } else {
        classNames.push("is-valid");
    }

    return (
        <div className={classNames.join(" ")}>
            { /* Render label for non-objects except for when an object has defined a ui:field template */}
            {(props.schema.type !== "object" || (props.schema.type === "object" && props.uiSchema["ui:field"])) &&
                <label htmlFor={id}>{label}{required ? "*" : null}</label>
            }
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
