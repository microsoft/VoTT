import React, { Fragment } from "react";
import { ObjectFieldTemplateProps } from "react-jsonschema-form";

export function ObjectFieldTemplate(props: ObjectFieldTemplateProps) {
    return (
        <Fragment>
            {props.title}
            {props.description}
            {props.properties.map((item) => item.content)}
        </Fragment>
    );
}
