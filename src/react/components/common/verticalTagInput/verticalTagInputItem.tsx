import React from "react";
import { ITag, ITagMetadata } from "../../../../models/applicationState";
import { invertColor } from "../../../../common/utils";

export default function VerticalTagInputItem({item, onClick, onChange}) {
    return (
        <li className="tag-item" onClick={onClick}>
            <table><tr>
                <td className={"tag-color"} style={getColorStyle(item)}>
                    {getDisplayIndex(item)}
                </td>
                <td className={"tag-content"} onDoubleClick={item.onDoubleClick}>                        
                    {getTagContent(item, onChange)}
                </td>
            </tr></table>
        </li>
    )
}


function getTagContent(item, onChange){
    if (item.editMode) {
        return (
            <input className="tag-editor" type="text" defaultValue={item.name} onKeyPress={(e) => handleTagEdit(item, e, onChange)}/>
        )
    } else {
        return (
            <span className={getContentClassName(item.isLocked)}>{item.name}</span>
        )
    }
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
