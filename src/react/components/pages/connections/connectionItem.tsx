import React from "react";
import { NavLink } from "react-router-dom";

export default function ConnectionItem({ id, name, onClick, onDelete }) {
    return (
        <li onClick={onClick}>
            <NavLink to={`/connections/${id}`}>
                <i className="fas fa-edit"></i>
                <span className="px-2">{name}</span>
                <div className="float-right delete-btn" onClick={onDelete}><i className="fas fa-trash"></i></div>
            </NavLink>
        </li>
    );
}
