import React from "react";

export default function CustomField(Widget, mapProps?: (props: any) => any) {
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
    }
}
