import React from "react";
import { ITag } from "../../../../models/applicationState";
import "./tagInput.scss";
import { KeyboardBinding } from "../keyboardBinding/keyboardBinding";

export interface ITagInputToolbarProps {
    selectedTag: ITag;
    onAddTags: () => void;
    onSearchTags: () => void;
    onLockTag: (tag: ITag) => void;
    onEditTag: (tag: ITag) => void;
    onDelete: (tag: ITag) => void;
    onReorder: (tag: ITag, displacement: number) => void;
}

interface ITagInputToolbarItemProps {
    displayName: string;
    className: string;
    icon: string;
    handler: () => void;
    accelerators?: string[];
}

export default class TagInputToolbar extends React.Component<ITagInputToolbarProps> {
    public render() {
        return (
            <div className="tag-input-toolbar">
                {
                    this.getButtonProps().map((prop) =>
                        <div className={`tag-input-toolbar-item ${prop.className}`} onClick={prop.handler}>
                            <i className={`tag-input-toolbar-icon fas ${prop.icon}`} />
                        </div>,
                    )
                }
            </div>
        );
    }

    private getButtonProps = (): ITagInputToolbarItemProps[] => {
        return [
            {
                displayName: "Add tag",
                className: "plus",
                icon: "fa-plus-circle",
                handler: this.handleAdd,
            },
            {
                displayName: "Search tags",
                className: "search",
                icon: "fa-search",
                handler: this.handleSearch,
            },
            {
                displayName: "Lock selected tag",
                className: "lock",
                icon: "fa-lock",
                handler: this.handleLock,
            },
            {
                displayName: "Edit selected tag",
                className: "edit",
                icon: "fa-edit",
                handler: this.handleEdit,
            },
            {
                displayName: "Move selected tag up",
                className: "up",
                icon: "fa-arrow-circle-up",
                handler: this.handleArrowUp,
            },
            {
                displayName: "Move selected tag down",
                className: "down",
                icon: "fa-arrow-circle-down",
                handler: this.handleArrowDown,
            },
            {
                displayName: "Delete selected tag",
                className: "delete",
                icon: "fa-trash",
                handler: this.handleDelete,
            },
        ];
    }

    private handleAdd = () => {
        this.props.onAddTags();
    }

    private handleSearch = () => {
        this.props.onSearchTags();
    }

    private handleLock = () => {
        this.props.onLockTag(this.props.selectedTag);
    }

    private handleEdit = () => {
        this.props.onEditTag(this.props.selectedTag);
    }

    private handleArrowUp = () => {
        this.props.onReorder(this.props.selectedTag, -1);
    }

    private handleArrowDown = () => {
        this.props.onReorder(this.props.selectedTag, 1);
    }

    private handleDelete = () => {
        this.props.onDelete(this.props.selectedTag);
    }
}
