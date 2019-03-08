import React, { SyntheticEvent } from "react";
import "./condensedList.scss";
import { Link } from "react-router-dom";

/**
 * Properties for Condensed List Component
 * @member title - Title of condensed list
 * @member items - Array of items to be rendered
 * @member newLinkTo - Link for list items
 * @member onClick - Function to call on clicking items
 * @member onDelete - Function to call on deleting items
 * @member Component - Component to be rendered for list items
 */
interface ICondensedListProps {
    title: string;
    Component: any;
    items: any[];
    displayEmptyMessage: boolean;
    Toolbar?: any;
    ToolbarProps?: any;
    newLinkTo?: string;
    onClick?: (item, e, properties: any) => void;
    onChange?: (oldItem, newItem) => void;
    onDelete?: (item) => void;
}

/**
 * @name - Condensed List
 * @description - Clickable, deletable and linkable list of items
 */
export default class CondensedList extends React.Component<ICondensedListProps> {
    constructor(props, context) {
        super(props, context);

        this.onItemClick = this.onItemClick.bind(this);
        this.onItemDelete = this.onItemDelete.bind(this);
    }

    public render() {
        const { title, items, newLinkTo, Component, Toolbar, ToolbarProps, displayEmptyMessage } = this.props;

        return (
            <div className="condensed-list">
                <h6 className="condensed-list-header bg-darker-2 p-2">
                    <span className="condensed-list-title">{title}</span>
                    {Toolbar && 
                        <div className="condensed-list-toolbar">
                            <Toolbar {...ToolbarProps}/>
                        </div>}
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
                {(items && items.length === 0) && displayEmptyMessage &&
                    <div className="p-3 text-center">No items found</div>
                }
                {(items && items.length > 0) &&
                    <ul className="condensed-list-items">
                        {items.map((item) => <Component key={item.id}
                            item={item}
                            onClick={(e, props: any) => this.onItemClick(item, e, props)}
                            onChange={(oldItem, newItem) => this.onItemChange(oldItem, newItem)}
                            onDelete={(e) => this.onItemDelete(e, item)} />)}
                    </ul>
                }
            </div>
        );
    }

    private onItemClick = (item, e, props: any) => {
        if (this.props.onClick) {
            this.props.onClick(item, e, props);
        }
    }

    private onItemChange = (oldItem, newItem) => {
        if (this.props.onChange) {
            this.props.onChange(oldItem, newItem);
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

/**
 * Generic list item with an onClick function and a name
 * @param param0 - {item: {name: ""}, onClick: (item) => void;}
 */
export function ListItem({ item, onClick }) {
    return (
        <li>
            <a onClick={onClick}>
                <span className="px-2">{item.name}</span>
            </a>
        </li>
    );
}
