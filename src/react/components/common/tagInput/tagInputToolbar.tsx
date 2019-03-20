import React from "react";
import { ITag } from "../../../../models/applicationState";
import "./tagInput.scss";

export interface ITagInputToolbarProps {
    selectedTag: ITag;
    onLockTag: (tag: ITag) => void;
    onEditTag: (tag: ITag) => void;
    onDelete: (tag: ITag) => void;
    onReorder: (tag: ITag, displacement: number) => void;
}

export default class TagInputToolbar extends React.Component<ITagInputToolbarProps> {
    render() {
        return (
            <div className="tag-input-toolbar">
                <i className="tag-input-toolbar-icon fas fa-lock"
                    onClick={this.handleLock}></i>
                <i className="tag-input-toolbar-icon fas fa-edit"
                    onClick={this.handleEdit}></i>
                <i className="tag-input-toolbar-icon fas fa-arrow-circle-up"
                    onClick={this.handleArrowUp}></i>
                <i className="tag-input-toolbar-icon fas fa-arrow-circle-down"
                    onClick={this.handleArrowDown}></i>
                <i className="tag-input-toolbar-icon fas fa-trash"
                    onClick={this.handleDelete}></i>
            </div>
        );
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


