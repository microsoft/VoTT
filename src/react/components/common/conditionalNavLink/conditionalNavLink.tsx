import React from "react";
import { NavLink } from "react-router-dom";

/**
 * Link able to be enabled/disabled
 * @param param0 - {
 *      to: "link for item"
 *      disabled: true if link is disabled
 *      props: {
 *          title: Title of item,
 *          children: Child items to include in span
 *      }
 * }
 */
export default function ConditionalNavLink({ to, disabled, ...props }) {
    if (disabled) {
        return (<span className="disabled" title={props.title} >{props.children}</span>);
    } else {
        return (<NavLink title={props.title} to={to}>{props.children}</NavLink>);
    }
}
