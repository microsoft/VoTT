import React, { Fragment } from "react";
import { FieldTemplateProps } from "react-jsonschema-form";

export default function CustomFieldTemplate(props: FieldTemplateProps) {
    const { id, label, required, description, help, rawErrors, children } = props;
    const classNames = [];
    if (props.schema.type === "object") {
        classNames.push("object-wrapper");
    } else {
        classNames.push("form-group");
        if (rawErrors && rawErrors.length > 0) {
            classNames.push("is-invalid");
        } else {
            classNames.push("is-valid");
        }
    }

    return (
        <div className={classNames.join(" ")}>
            { /* Render label for non-objects except for when an object has defined a ui:field template */}
            {props.schema.type !== "array" &&
                (props.schema.type !== "object" || (props.schema.type === "object" && props.uiSchema["ui:field"])) &&
                <label htmlFor={id}>{label}{required ? "*" : null}</label>
            }
            {props.schema.type === "array" &&
                <Fragment>
                    <h4>{label}</h4>
                    {description && <small>{description}</small>}
                </Fragment>
            }
            {children}
            {props.schema.type !== "array" && description && <small className="text-muted">{description}</small>}
            {rawErrors && rawErrors.length > 0 &&
                <div className="invalid-feedback">
                    {rawErrors.map((errorMessage, idx) => <div key={idx}>{label} {errorMessage}</div>)}
                </div>
            }
        </div>
    );
}
