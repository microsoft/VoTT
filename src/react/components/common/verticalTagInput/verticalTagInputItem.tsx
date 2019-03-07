import React from "react";
import { ITag } from "../../../../models/applicationState";
import { invertColor } from "../../../../common/utils";
import { CirclePicker } from 'react-color'
import { TagEditMode } from "./verticalTagInput";

export interface IVerticalTagItemProps extends ITag {
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
    if (item.isBeingEdited) {
        if (item.tagEditMode === TagEditMode.Name) {
            return (
                <input className="tag-editor" type="text" defaultValue={item.name} onKeyPress={(e) => handleTagEdit(item, e, onChange)}/>
            )
        } else if (item.tagEditMode === TagEditMode.Color) {
            return (
                <div>
                    {getDefaultTagContent(item)}
                    <CirclePicker
                        color={item.color}
                        onChangeComplete={(color) => handleColorEdit(item, color, onChange)}
                    />
                </div>
            )
        }
    } else {
        return getDefaultTagContent(item);
    }
}

function getDefaultTagContent(item) {
    return (
        <span className={getContentClassName(item.isLocked)}>{item.name}</span>
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

function getContentClassName(isLocked){
    let className = "px-2";
    if(isLocked) {
        className += " locked-tag";
    }
    return className;
}

function getColorStyle(item,){
    const style = {
        backgroundColor: item.color,
        color: invertColor(item.color),
        display: "flex",
        justifyContent: "center",
    };
    return style;
}

function getDisplayIndex(item){
    const index = item.index;
    const displayIndex = (index === 9) ? 0 : index + 1;
    return (index < 10) ? displayIndex : " ";
}
