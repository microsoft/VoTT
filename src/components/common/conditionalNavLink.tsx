import React from "react";
import { NavLink } from "react-router-dom";

export default function ConditionalNavLink({ to, disabled, ...props }) {
    if (disabled) {
        return (<span className="disabled" title={props.title} >{props.children}</span>);
    } else {
        return (<NavLink title={props.title} to={to}>{props.children}</NavLink>);
    }
}
