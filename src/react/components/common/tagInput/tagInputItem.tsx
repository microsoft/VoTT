import React from "react";
import { ITag } from "../../../../models/applicationState";
import { constants } from "../../../../common/constants";
// tslint:disable-next-line:no-var-requires
const tagColors = require("../tagColors.json");

export enum TagEditMode {
    Color = "color",
    Name = "name",
}

export interface ITagClickProps {
    ctrlKey?: boolean;
    altKey?: boolean;
    clickedColor?: boolean;
}

/**
 * Properties for tag input item
 */
export interface ITagInputItemProps {
    /** Tag represented by item */
    tag: ITag;
    /** Index of tag within tags array */
    index: number;
    /** Tag is currently being edited */
    isBeingEdited: boolean;
    /** Tag is currently locked for application */
    isLocked: boolean;
    /** Tag is currently selected */
    isSelected: boolean;
    /** Tag is currently applied to one of the selected regions */
    appliedToSelectedRegions: boolean;
    /** Function to call upon clicking item */
    onClick: (tag: ITag, props: ITagClickProps) => void;
    /** Apply updates to tag */
    onChange: (oldTag: ITag, newTag: ITag) => void;
}

export interface ITagInputItemState {
    /** Tag is currently being edited */
    isBeingEdited: boolean;
    /** Tag is currently locked for application */
    isLocked: boolean;
    /** Mode of tag editing (text or color) */
    tagEditMode: TagEditMode;
}

export default class TagInputItem extends React.Component<ITagInputItemProps, ITagInputItemState> {
    public state: ITagInputItemState = {
        isBeingEdited: false,
        isLocked: false,
        tagEditMode: null,
    };

    public render() {
        const style: any = {
            background: this.props.tag.color,
        };
        if (this.props.appliedToSelectedRegions) {
            style.borderColor = this.props.tag.color;
        }
        return (
            <div className={"tag-item-block"}>
                {
                    this.props.tag &&
                    <li className={this.getItemClassName()} style={style}>
                        <div
                            className={`tag-color`}
                            onClick={this.onColorClick}
                            style={this.getColorStyle()}>
                        </div>
                        <div
                            className={"tag-content"}
                            onClick={this.onNameClick}>
                            {this.getTagContent()}
                        </div>
                        {
                            this.state.isLocked &&
                            <div></div>
                        }
                    </li>
                }
            </div>
        );
    }

    public componentDidUpdate(prevProps: ITagInputItemProps) {
        if (prevProps.isBeingEdited !== this.props.isBeingEdited) {
            this.setState({
                isBeingEdited: this.props.isBeingEdited,
            });
        }

        if (prevProps.isLocked !== this.props.isLocked) {
            this.setState({
                isLocked: this.props.isLocked,
            });
        }
    }

    private onColorClick = (e) => {
        const ctrlKey = e.ctrlKey;
        const altKey = e.altKey;
        this.setState({
            tagEditMode: TagEditMode.Color,
        }, () => this.props.onClick(this.props.tag, {ctrlKey, altKey, clickedColor: true}));
    }

    private onNameClick = (e) => {
        const ctrlKey = e.ctrlKey;
        const altKey = e.altKey;
        this.setState({
            tagEditMode: TagEditMode.Name,
        }, () => this.props.onClick(this.props.tag, {ctrlKey, altKey}));
    }

    private getItemClassName = () => {
        const classNames = ["tag-item"];
        if (this.props.isSelected) {
            classNames.push("tag-item-selected");
        }
        if (this.props.appliedToSelectedRegions) {
            classNames.push("tag-item-applied");
        }
        return classNames.join(" ");
    }

    private getTagContent = () => {
        const displayIndex = this.getDisplayIndex();
        return (
            <div className={"tag-name-container"}>
                {
                    (this.state.isBeingEdited && this.state.tagEditMode === TagEditMode.Name)
                    ?
                    <input
                        className={`tag-name-editor ${this.getContentClassName()}`}
                        type="text"
                        defaultValue={this.props.tag.name}
                        onKeyDown={(e) => this.handleNameEdit(e)}
                        autoFocus={true}
                    />
                    :
                    <span className={this.getContentClassName()}>{this.props.tag.name}</span>
                }
                {
                    this.props.isLocked &&
                    <div className="tag-lock-icon">
                        <i className="fas fa-lock" />
                    </div>
                }
                <div className={"tag-index"}>
                    {(displayIndex !== null) && <span>[{displayIndex}]</span>}
                </div>
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
        } else if (e.key === "Escape") {
            this.setState({
                isBeingEdited: false,
            });
        }
    }

    private getContentClassName = () => {
        const classNames = ["tag-name-text px-2"];
        if (this.state.isBeingEdited && this.state.tagEditMode === TagEditMode.Color) {
            classNames.push(" tag-color-edit");
        }
        return classNames.join(" ");
    }

    private getColorStyle = () => {
        const style = {
            backgroundColor: this.props.tag.color,
            color: "#fff",
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
