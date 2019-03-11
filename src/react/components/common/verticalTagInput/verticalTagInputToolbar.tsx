import React from "react";
import { ITag } from "../../../../models/applicationState";
import "./verticalTagInput.scss";

export interface IVerticalTagInputToolbarProps {
    selectedTag: ITag;
    onLockTag: (tag: ITag) => void;
    onEditTag: (tag: ITag) => void;
    onDelete: (tag: ITag) => void;
    onReorder: (tag: ITag, displacement: number) => void;
}

export default function VerticalTagInputToolbar(props: IVerticalTagInputToolbarProps) {
    const {selectedTag, onLockTag, onEditTag, onDelete, onReorder} = props;
    return (
        <div className="tag-input-toolbar">
            <i className="tag-input-toolbar-icon fas fa-lock"
                onClick={(e) => handleLock(selectedTag, onLockTag)}></i>
            <i className="tag-input-toolbar-icon fas fa-edit"
                onClick={(e) => handleEdit(selectedTag, onEditTag)}></i>
            <i className="tag-input-toolbar-icon fas fa-arrow-circle-up"
                onClick={(e) => handleArrowUp(selectedTag, onReorder)}></i>
            <i className="tag-input-toolbar-icon fas fa-arrow-circle-down"
                onClick={(e) => handleArrowDown(selectedTag, onReorder)}></i>
            <i className="tag-input-toolbar-icon fas fa-trash"
                onClick={(e) => handleDelete(selectedTag, onDelete)}></i>
        </div>
    );
}

function handleLock(selectedTag: ITag, onLockTag) {
    onLockTag(selectedTag);
}

function handleEdit(selectedTag: ITag, onEditTag) {
    onEditTag(selectedTag);
}

function handleArrowUp(selectedTag: ITag, onReorder) {
    onReorder(selectedTag, -1);
}

function handleArrowDown(selectedTag: ITag, onReorder) {
    onReorder(selectedTag, 1);
}

function handleDelete(selectedTag: ITag, onDelete) {
    onDelete(selectedTag);
}
