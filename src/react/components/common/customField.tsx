import React from "react";
import { FieldProps } from "react-jsonschema-form";

export default function CustomField(Widget, mapProps?: (props: FieldProps) => any) {
    return function render(props) {
        const { idSchema, schema, required } = props;
        const widgetProps = mapProps ? mapProps(props) : props;
        return (
            <div>
                <label className="control-label" htmlFor={idSchema.$id}>{schema.title}{required ? "*" : null}</label>
                {schema.description}
                <Widget {...widgetProps} />
            </div>
        );
    };
}
