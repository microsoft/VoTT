import React from "react";
import { ITag } from "../../../../models/applicationState";
import { invertColor } from "../../../../common/utils";
import { CirclePicker } from 'react-color'
import { TagEditMode } from "./verticalTagInput";
const tagColors = require("../../common/tagColors.json");

export interface IVerticalTagItemProps {
    tag: ITag;
    index: number;
    isLocked: boolean;
    isBeingEdited: boolean;
    tagEditMode: TagEditMode;
}

export default function VerticalTagInputItem({item, onClick, onChange}) {
    return (
        <li className="tag-item">
            <table><tr>
                <td onClick={(e) => onClick(e, {clickTarget: TagEditMode.Color})} className={"tag-color"} style={getColorStyle(item)}>
                    {getDisplayIndex(item)}
                </td>
                <td onClick={(e) => onClick(e, {clickTarget: TagEditMode.Name})} className={"tag-content"}>                        
                    {getTagContent(item, onChange)}
                </td>
            </tr></table>
        </li>
    )
}

function getTagContent(item: IVerticalTagItemProps, onChange){
    const tag = item.tag;
    if (item.isBeingEdited) {
        if (item.tagEditMode === TagEditMode.Name) {
            return (
                <input className="tag-editor" type="text" defaultValue={tag.name} onKeyPress={(e) => handleTagEdit(tag, e, onChange)}/>
            )
        } else if (item.tagEditMode === TagEditMode.Color) {
            return (
                <div>
                    {getDefaultTagContent(item)}
                    <CirclePicker
                        color={tag.color}
                        onChangeComplete={(color) => handleColorEdit(tag, color, onChange)}
                        colors={tagColors}
                        width={175}
                        circleSize={22}
                        circleSpacing={10}
                    />
                </div>
            )
        }
    } else {
        return getDefaultTagContent(item);
    }
}

function getDefaultTagContent(item, additionalClassNames?) {
    return (
        <div>
            {
                (item.isLocked) ? <i className="fas fa-lock tag-lock-icon"></i> : ""
            }
            <span className={getContentClassName(item)}>{item.tag.name}</span>
        </div>
    )
}

function handleTagEdit(item: ITag, e, onChange){
    if(e.key === "Enter") {
        const newTagName = e.target.value;
        onChange(item, {
            ...item, 
            name: newTagName,
        })
    }
}

function handleColorEdit(item: ITag, color, onChange) {
    onChange(item, {
        ...item,
        color: color.hex
    })
}

function getContentClassName(item){
    let className = "px-2";
    if(item.isLocked) {
        className += " locked-tag";
    }
    if(item.isBeingEdited && item.tagEditMode === TagEditMode.Color) {
        className += " tag-color-edit";
    }
    return className;
}

function getColorStyle(item){
    const style = {
        backgroundColor: item.tag.color,
        color: invertColor(item.tag.color),
        display: "flex",
        justifyContent: "center",
    };
    return style;
}

function getDisplayIndex(item){
    const index = item.index;
    const displayIndex = (index === 9) ? 0 : index + 1;
    return (index < 10) ? displayIndex : "-";
}
