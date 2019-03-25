import React from "react";

export default function RecentProjectItem({ name, onClick, onDelete }) {
    return (
        <li className="recent-project-item">
            <a onClick={onClick}>
                <i className="fas fa-folder-open"></i>
                <span className="px-2">{name}</span>
                <div className="float-right delete-btn" onClick={onDelete}><i className="fas fa-trash"></i></div>
            </a>
        </li>
    );
}
