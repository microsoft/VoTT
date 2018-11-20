import React from 'react'
import './condensedList.scss';

export default function CondensedList({title, items, Component, onClick}) {
    return (
        <div className="condensed-list">
            <h6 className="condensed-list-header bg-darker-2 p-2">{title}</h6>
            <ul className="condensed-list-items">
                {items.map(item => <Component key={item.id} item={item} onClick={onClick} />)}
            </ul>
        </div>
    );
}