import React from "react";
import { ITag } from "../../../../models/applicationState";
import { idealTextColor } from "../../../../common/utils";
import { GithubPicker } from "react-color";
import { TagEditMode } from "./verticalTagInput";
// tslint:disable-next-line:no-var-requires
const tagColors = require("../tagColors.json");

export interface IVerticalTagItemProps {
    tag: ITag;
    index: number;
    isLocked: boolean;
    isSelected: boolean;
    isBeingEdited: boolean;
    tagEditMode: TagEditMode;
}

export default function VerticalTagInputItem({item, onClick, onChange, onDelete}) {
    const displayIndex = getDisplayIndex(item);

    return (
        <div className={"tag-item-block"}>
            <li className={getItemClassName(item)} style={{
                borderColor: item.tag.color,
                background: item.tag.color,
            }}>
                <div
                    className={"tag-color"}
                    onClick={(e) => onClick(e, {clickTarget: TagEditMode.Color})}
                    style={getColorStyle(item)}
                ></div>
                <div
                    className={"tag-content"}
                    onClick={(e) => onClick(e, {clickTarget: TagEditMode.Name})}
                >
                    {getTagContent(item, onChange, onDelete)}
                </div>
                {
                    (displayIndex !== null) &&
                    <div className={"tag-index"}>
                        [{displayIndex}]
                    </div>
                }

            </li>
            {
                (item.isBeingEdited && item.tagEditMode === TagEditMode.Color) ? getColorPicker(item, onChange) : ""
            }
        </div>
    );
}

function getItemClassName(item) {
    let className = "tag-item";
    if (item.isSelected) {
        className += " tag-item-selected";
    }
    return className;
}

function getColorPicker(item, onChange) {
    return (
        <div className="tag-color-picker">
            <GithubPicker
                color={item.tag.color}
                onChangeComplete={(color) => handleColorEdit(item.tag, color, onChange)}
                colors={tagColors}
                width={165}
                styles={{
                    card: {
                        background: "#fff",
                    },
                }}
            />
        </div>
    );
}

function getTagContent(item: IVerticalTagItemProps, onChange, onDelete) {
    const tag = item.tag;
    if (item.isBeingEdited && item.tagEditMode === TagEditMode.Name) {
        return (
            <input
                className="tag-name-editor"
                type="text"
                defaultValue={tag.name}
                onKeyPress={(e) => handleNameEdit(e, tag, onChange)}
            />
        );
    } else {
        return getDefaultTagContent(item, onDelete);
    }
}

function getDefaultTagContent(item, onDelete) {
    return (
        <div>
            {
                (item.isLocked) ? <i className="fas fa-lock tag-lock-icon"></i> : ""
            }
            <span className={getContentClassName(item)}>{item.tag.name}</span>
        </div>
    );
}

function handleNameEdit(e, tag: ITag, onChange) {
    if (e.key === "Enter") {
        const newTagName = e.target.value;
        onChange(tag, {
            ...tag,
            name: newTagName,
        });
    }
}

function handleColorEdit(tag: ITag, color, onChange) {
    onChange(tag, {
        ...tag,
        color: color.hex,
    });
}

function handleTagDelete(e, tag: ITag, onDelete) {
    onDelete(e, tag);
}

function getContentClassName(item: IVerticalTagItemProps) {
    let className = "px-2";
    if (item.isBeingEdited && item.tagEditMode === TagEditMode.Color) {
        className += " tag-color-edit";
    }
    return className;
}

function getColorStyle(item) {
    const style = {
        backgroundColor: item.tag.color,
        color: idealTextColor(item.tag.color),
        display: "flex",
        justifyContent: "center",
    };
    return style;
}

function getDisplayIndex(item) {
    const index = item.index;
    const displayIndex = (index === 9) ? 0 : index + 1;
    return (displayIndex < 10) ? displayIndex : null;
}
