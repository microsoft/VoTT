import React from 'react';

export default function RecentProjectItem({ item, onClick }) {
    return (
        <li onClick={() => onClick(item)}>
            <i className="fas fa-folder-open"></i>
            <span className="px-2">{item.name}</span>
        </li>
    );
}