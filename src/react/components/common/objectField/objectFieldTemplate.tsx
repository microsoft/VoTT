import React from "react";
import { ObjectFieldTemplateProps } from "react-jsonschema-form";

export function ObjectFieldTemplate(props: ObjectFieldTemplateProps) {
    return (
        <div>
            {props.title}
            {props.description}
            {props.properties.map((item) => item.content)}
        </div>
    );
}
