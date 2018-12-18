import React from "react";

export default function CustomField<TComponent>(props) {
    const { id, classNames, label, help, required, description, errors, children } = props;

    return (
        <div className={classNames}>
            <label className="control-label" htmlFor={id}>{label}{required ? "*" : null}</label>
            {description}
            <TComponent {...props} />
            {errors}
            {help}
        </div>
    );
}
