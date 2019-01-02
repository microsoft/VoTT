import React, { SyntheticEvent } from "react";
import "./condensedList.scss";
import { Link } from "react-router-dom";

interface ICondensedListProps {
    title: string;
    items: any[];
    newLinkTo?: string;
    onClick?: (item) => void;
    onDelete?: (item) => void;
    Component: any;
}

export default class CondensedList extends React.Component<ICondensedListProps> {
    constructor(props, context) {
        super(props, context);

        this.onItemClick = this.onItemClick.bind(this);
        this.onItemDelete = this.onItemDelete.bind(this);
    }

    public render() {
        const { title, items, newLinkTo, Component } = this.props;

        return (
            <div className="condensed-list">
                <h6 className="condensed-list-header bg-darker-2 p-2">
                    <span>{title}</span>
                    {newLinkTo &&
                        <Link to={newLinkTo} className="float-right">
                            <i className="fas fa-plus-square" />
                        </Link>
                    }
                </h6>
                {(!items) &&
                    <div className="p-3 text-center">
                        <i className="fas fa-circle-notch fa-spin" />
                    </div>
                }
                {(items && items.length === 0) &&
                    <div className="p-3 text-center">No items found</div>
                }
                {(items && items.length > 0) &&
                    <ul className="condensed-list-items">
                        {items.map((item) => <Component key={item.id}
                            item={item}
                            onClick={(e) => this.onItemClick(e, item)}
                            onDelete={(e) => this.onItemDelete(e, item)} />)}
                    </ul>
                }
            </div>
        );
    }

    private onItemClick = (e, item) => {
        if (this.props.onClick) {
            this.props.onClick(item);
        }
    }

    private onItemDelete = (e: SyntheticEvent, item) => {
        e.stopPropagation();
        e.preventDefault();

        if (this.props.onDelete) {
            this.props.onDelete(item);
        }
    }
}

export function ListItem({ item, onClick }) {
    return (
        <li>
            <a onClick={onClick}>
                <i className="fas"></i>
                <span className="px-2">{item.name}</span>
            </a>
        </li>
    );
}
