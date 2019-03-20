import React from "react";
import { ITag } from "../../../../models/applicationState";
import { idealTextColor, elipsify } from "../../../../common/utils";
import { GithubPicker } from "react-color";
import { TagEditMode } from "./tagInput";
import { constants } from "../../../../common/constants";
// tslint:disable-next-line:no-var-requires
const tagColors = require("../tagColors.json");

export interface ITagItemProps {
    tag: ITag;
    index: number;
    isLocked: boolean;
    isSelected: boolean;
    isBeingEdited: boolean;
    tagEditMode: TagEditMode;
    onClick: (event, tag: ITag, clickTarget: TagEditMode) => void;
    onChange: (oldTag: ITag, newTag: ITag) => void;
}

export default class TagInputItem extends React.Component<ITagItemProps> {

    public render() {
        const displayIndex = this.getDisplayIndex();

        return (
            <div className={"tag-item-block"}>
                {
                    this.props.tag && 
                    <li className={this.getItemClassName()} style={{
                        borderColor: this.props.tag.color,
                        background: this.props.tag.color,
                    }
                }>
                    <div
                        className={"tag-color"}
                        onClick={(e) => this.props.onClick(e, this.props.tag, TagEditMode.Color)}
                        style={this.getColorStyle()}
                    ></div>
                    <div
                        className={"tag-content"}
                        onClick={(e) => this.props.onClick(e, this.props.tag, TagEditMode.Name)}
                    >
                        {this.getTagContent()}
                    </div>
                    {
                        (displayIndex !== null) &&
                        <div className={"tag-index"}>
                            [{displayIndex}]
                        </div>
                    }

                </li>
                }
                {
                    (this.props.isBeingEdited && this.props.tagEditMode === TagEditMode.Color)
                    ?
                    this.getColorPicker()
                    :
                    ""
                }                
            </div>
        );
    }

    private getItemClassName = () => {
        let className = "tag-item";
        if (this.props.isSelected) {
            className += " tag-item-selected";
        }
        return className;
    }

    private getColorPicker = () => {
        return (
            <div className="tag-color-picker">
                <GithubPicker
                    color={this.props.tag.color}
                    onChangeComplete={(color) => this.handleColorEdit(color)}
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

    private getTagContent = () => {
        if (this.props.isBeingEdited && this.props.tagEditMode === TagEditMode.Name) {
            return (
                <input
                    className="tag-name-editor"
                    type="text"
                    defaultValue={this.props.tag.name}
                    onKeyPress={(e) => this.handleNameEdit(e)}
                />
            );
        } else {
            return this.getDefaultTagContent();
        }
    }

    private getDefaultTagContent = () => {
        return (
            <div>
                {
                    (this.props.isLocked) ? <i className="fas fa-lock tag-lock-icon"></i> : ""
                }
                <span className={this.getContentClassName()}>
                    {elipsify(this.props.tag.name, constants.tagNameLength)}
                </span>
            </div>
        );
    }

    private handleNameEdit = (e) => {
        if (e.key === "Enter") {
            const newTagName = e.target.value;
            this.props.onChange(this.props.tag, {
                ...this.props.tag,
                name: newTagName,
            });
        }
    }

    private handleColorEdit = (color) => {
        this.props.onChange(this.props.tag, {
            ...this.props.tag,
            color: color.hex,
        });
    }

    private getContentClassName = () => {
        let className = "px-2";
        if (this.props.isBeingEdited && this.props.tagEditMode === TagEditMode.Color) {
            className += " tag-color-edit";
        }
        return className;
    }

    private getColorStyle = () => {
        const style = {
            backgroundColor: this.props.tag.color,
            color: idealTextColor(this.props.tag.color),
            display: "flex",
            justifyContent: "center",
        };
        return style;
    }

    private getDisplayIndex = () => {
        const index = this.props.index;
        const displayIndex = (index === 9) ? 0 : index + 1;
        return (displayIndex < 10) ? displayIndex : null;
    }
}
