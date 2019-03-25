import React from "react";
import { ITag } from "../../../../models/applicationState";
import { GithubPicker } from "react-color";
import { constants } from "../../../../common/constants";
// tslint:disable-next-line:no-var-requires
const tagColors = require("../tagColors.json");

export enum TagEditMode {
    Color = "color",
    Name = "name",
}

export interface ITagInputItemProps {
    tag: ITag;
    index: number;
    isBeingEdited: boolean;
    isLocked: boolean;
    isSelected: boolean;
    appliedToSelectedRegions: boolean;
    onClick: (event, tag: ITag) => void;
    onChange: (oldTag: ITag, newTag: ITag) => void;
}

export interface ITagInputItemState {
    isBeingEdited: boolean;
    tagEditMode: TagEditMode;
    preventSingleClick: boolean;
}

const delay = 200;

export default class TagInputItem extends React.Component<ITagInputItemProps, ITagInputItemState> {

    public state = {
        isBeingEdited: false,
        tagEditMode: null,
        preventSingleClick: false,
    };

    public render() {
        const displayIndex = this.getDisplayIndex();

        return (
            <div className={"tag-item-block"}>
                {
                    this.props.tag &&
                    <li className={this.getItemClassName()} style={{
                        borderColor: this.props.tag.color,
                        background: this.props.tag.color,
                    }}>
                        <div
                            className={"tag-color"}
                            onClick={this.onColorClick}
                            style={this.getColorStyle()}>
                        </div>
                        <div
                            className={"tag-content"}
                            onClick={this.onNameClick}>
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
                    (this.state.isBeingEdited && this.state.tagEditMode === TagEditMode.Color)
                    ?
                    this.getColorPicker()
                    :
                    ""
                }
            </div>
        );
    }

    public componentDidUpdate(prevProps: ITagInputItemProps){
        if (prevProps.isBeingEdited !== this.props.isBeingEdited) {
            this.setState({
                isBeingEdited: this.props.isBeingEdited
            });
        }
    }

    private onColorClick = (e) => {
        this.setState({
            tagEditMode: TagEditMode.Color,
        }, () => this.props.onClick(e, this.props.tag));
    }

    private onNameClick = (e) => {
        this.setState({
            tagEditMode: TagEditMode.Name,
        }, () => this.props.onClick(e, this.props.tag));
    }

    // private onColorDoubleClick = (e) => {
    //     this.setState({
    //         preventSingleClick: true
    //     });
    //     setTimeout(() => {
    //         this.setState({preventSingleClick: false})
    //     }, delay * 2);
    // }

    // private onTextDoubleClick = (e) => {
    //     this.setState({
    //         preventSingleClick: true
    //     });
    //     setTimeout(() => {
    //         this.setState({preventSingleClick: false})
    //     }, delay * 2);
    // }

    private getItemClassName = () => {
        let className = "tag-item";
        if (this.props.isSelected) {
            className += " tag-item-selected";
        }
        if (this.props.appliedToSelectedRegions) {
            className += " tag-item-applied";
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
        if (this.state.isBeingEdited && this.state.tagEditMode === TagEditMode.Name) {

            return (
                <input
                    className="tag-name-editor"
                    type="text"
                    defaultValue={this.props.tag.name}
                    onKeyPress={(e) => this.handleNameEdit(e)}
                    autoFocus={true}
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
                <span className={this.getContentClassName()}>{this.props.tag.name}</span>
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
        let className = "tag-name px-2";
        if (this.state.isBeingEdited && this.state.tagEditMode === TagEditMode.Color) {
            className += " tag-color-edit";
        }
        return className;
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
