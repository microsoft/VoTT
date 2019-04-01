import React from "react";
import { FieldProps, WidgetProps } from "react-jsonschema-form";
import Guard from "../../../../common/guard";

/**
 * Custom field for react-jsonschema-form
 * @param Widget UI Widget for form
 * @param mapProps Function mapping props to an object
 */
export function CustomField<Props = {}>(Widget: any, mapProps?: (props: FieldProps) => Props) {
    Guard.null(Widget);

    return function render(props: FieldProps) {
        const widgetProps = mapProps ? mapProps(props) : props;
        return (<Widget {...widgetProps} />);
    };
}

/**
 * Custom widget for react-jsonschema-form
 * @param Widget UI Widget for form
 * @param mapProps Function mapping component props to form widget props
 */
export function CustomWidget<Props = {}>(Widget: any, mapProps?: (props: WidgetProps) => Props) {
    Guard.null(Widget);

    return function render(props: WidgetProps) {
        const widgetProps = mapProps ? mapProps(props) : props;
        return (<Widget {...widgetProps} />);
    };
}
