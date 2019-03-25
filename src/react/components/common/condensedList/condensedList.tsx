import React, { SyntheticEvent, ReactElement } from "react";
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
    Toolbar?: ReactElement<any>;
    hideEmptyMessage?: boolean;
    search?: (item, query: string) => boolean;
    newLinkTo?: string;
    onClick?: (item) => void;
    onDelete?: (item) => void;
}

interface ICondensedListState {
    searchQuery: string;
}

/**
 * @name - Condensed List
 * @description - Clickable, deletable and linkable list of items
 */
export default class CondensedList extends React.Component<ICondensedListProps> {

    state = {
        searchQuery: "",
    }

    public render() {
        const { title, items, newLinkTo, Component, Toolbar, hideEmptyMessage, search } = this.props;

        return (
            <div className="condensed-list">
                <h6 className="condensed-list-header bg-darker-2 p-2">
                    <span className="condensed-list-title">{title}</span>
                    {
                        Toolbar &&
                        <div className="condensed-list-toolbar">
                            {Toolbar}
                        </div>
                    }
                    {newLinkTo &&
                        <Link to={newLinkTo} className="float-right">
                            <i className="fas fa-plus-square" />
                        </Link>
                    }
                </h6>
                <div className="condensed-list-body">
                    {
                        search &&
                        <div className="search-input">
                            <input type="text" onChange={this.handleSearch} placeholder="Search tags"/>
                        </div>
                    }
                    {(!items) &&
                        <div className="p-3 text-center">
                            <i className="fas fa-circle-notch fa-spin" />
                        </div>
                    }
                    {(items && items.length === 0) && !hideEmptyMessage &&
                        <div className="p-3 text-center">No items found</div>
                    }
                    {(items && items.length > 0) &&
                        <ul className="condensed-list-items">
                            {((this.state.searchQuery === "") ? 
                                items
                                :
                                items.filter((item) => this.props.search(item, this.state.searchQuery)))
                                    .map((item) => 
                                        <Component key={item.id}
                                            onClick={(e) => this.onItemClick(e, item)}
                                            onDelete={(e) => this.onItemDelete(e, item)}
                                            {...item}
                                        />)}
                        </ul>
                    }
                </div>
            </div>
        );
    }

    private handleSearch = (event) => {
        this.setState({
            searchQuery: event.target.value
        });
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

/**
 * Generic list item with an onClick function and a name
 * @param param0 - {item: {name: ""}, onClick: (item) => void;}
 */
export function ListItem({ name, onClick }) {
    return (
        <li>
            <a onClick={onClick}>
                <span className="px-2">{name}</span>
            </a>
        </li>
    );
}
