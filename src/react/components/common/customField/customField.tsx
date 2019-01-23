import React from "react";
import { FieldProps } from "react-jsonschema-form";
import Guard from "../../../../common/guard";

/**
 * Custom field for react-jsonschema-form
 * @param Widget UI Widget for form
 * @param mapProps Function mapping props to an object
 */
export default function CustomField<Props = {}>(Widget: any, mapProps?: (props: FieldProps) => Props) {
    Guard.null(Widget);

    return function render(props: FieldProps) {
        const widgetProps = mapProps ? mapProps(props) : props;
        return ( <Widget {...widgetProps} /> );
    };
}
