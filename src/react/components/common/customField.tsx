import React from "react";
import { FieldProps } from "react-jsonschema-form";
import Guard from "../../../common/guard";

export default function CustomField(Widget: any, mapProps?: (props: FieldProps) => any) {
    Guard.null(Widget);

    return function render(props: FieldProps) {
        const { idSchema, schema, required } = props;
        const widgetProps = mapProps ? mapProps(props) : props;
        return (<Widget {...widgetProps} />);
    };
}
