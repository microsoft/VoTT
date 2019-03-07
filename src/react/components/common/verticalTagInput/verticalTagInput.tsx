import React from "react";
import { strings } from "../../../../common/strings";
import { ITag } from "../../../../models/applicationState";
import CondensedList from "../condensedList/condensedList";
import "./verticalTagInput.scss";
import VerticalTagInputItem, { IVerticalTagItemProps } from "./verticalTagInputItem";
import { randomIntInRange } from "../../../../common/utils";
const tagColors = require("../../common/tagColors.json");

export interface IVerticalTagInputProps {
    /** Current list of tags */
    tags: ITag[];
    /** Tags that are currently locked for editing experience */
    lockedTags: string[];
    onChange: (tags: ITag[]) => void;
    /** Place holder for input text box.
     * @default New Tag
     */
    placeHolder?: string;
    /** Key code delimiters for creating a new tag */
    delimiters?: number[];
    /** Colors for tags */
    tagColors?: { [id: string]: string };
    /** Function to call on clicking individual tag */
    onTagClick?: (tag: ITag) => void;
    /** Function to call on clicking individual tag while holding CTRL key */
    onCtrlTagClick?: (tag: ITag) => void;
}

export interface IVerticalTagInputState {
    tags: ITag[];
    selectedTag: ITag;
    editingTag: ITag;
    tagEditMode: TagEditMode;
}

export enum TagEditMode {
    Color = "color",
    Name = "name",
}

export class VerticalTagInput extends React.Component<IVerticalTagInputProps, IVerticalTagInputState> {

    state = {
        tags: this.props.tags || [],
        lockedTags: [],
        selectedTag: null,
        editingTag: null,
        tagEditMode: null,
    }


    render() {
        return (
            <div className="vertical-tag-input">
                <CondensedList
                    title={strings.tags.title}
                    Component={VerticalTagInputItem}
                    items={this.getListItems()}
                    onClick={this.handleClick}
                    onChange={this.updateTag}
                    onDelete={this.handleDelete}
                />
                <input type="text" onKeyPress={this.handleKeyPress} placeholder="Add new tag"/>
            </div>
        )
    }

    private updateTag = (oldTag: ITag, newTag: ITag) => {
        const tags = this.state.tags.map((t) => {
            return (t.name === oldTag.name) ? newTag : t;
        });
        this.setState({
            tags,
            editingTag: null,
            selectedTag: newTag,
        }, () => this.props.onChange(tags));
    }

    private getListItems = (): IVerticalTagItemProps[] => {
        const tags = this.state.tags;
        return tags.map((tag) => {
            const item: IVerticalTagItemProps = {
                tag,
                index: tags.findIndex((t) => t.name === tag.name),
                isLocked: this.props.lockedTags.findIndex((t) => t === tag.name) > -1,
                isBeingEdited: this.state.editingTag && this.state.editingTag.name === tag.name,
                tagEditMode: this.state.tagEditMode,
            }
            return item;
        })
    }

    private handleClick = (item: IVerticalTagItemProps, e, props) => {
        const tag = item.tag;
        if (e.altKey) {
            this.setState({
                editingTag: tag,
                selectedTag: null,
                tagEditMode: props.clickTarget,
            });
        } else if (e.ctrlKey && this.props.onCtrlTagClick) {
            this.props.onCtrlTagClick(tag);
        }
        else {
            if (this.state.editingTag && item && tag.name !== this.state.editingTag.name) {
                this.setState({
                    selectedTag: tag,
                    editingTag: null,
                });
            }
            if (this.props.onTagClick) {
                this.props.onTagClick(tag);
            }
        }
    }

    private handleDelete = (tag) => {
        debugger;
    }

    private handleKeyPress = (event) => {
        if (event.key === "Enter") {
            //validate and add
            const newTag: ITag = {
                name: event.target.value,
                color: this.getNextColor(),
            }
            if (!this.state.tags.find((t) => t.name === newTag.name)) {
                this.addTag(newTag);
                event.target.value = "";
            } else {
                // toast that tells them to pick another name
            }
        }
    }

    private getNextColor = () => {
        const tags = this.state.tags;
        if (tags.length > 0) {
            const lastColor = tags[tags.length - 1].color;
            const lastIndex = tagColors.findIndex((color) => color === lastColor);
            let newIndex;
            if (lastIndex > -1) {
                newIndex = (lastIndex + 1) % tagColors.length;
            } else {
                newIndex = randomIntInRange(0, tagColors.length - 1);
            }
            return tagColors[newIndex]
        } else {
            return tagColors[0];
        }
    }

    private addTag = (tag: ITag) => {
        if (!this.state.tags.find((t) => t.name === tag.name)) {
            const tags = [...this.state.tags, tag]
            this.setState({
                tags
            }, () => this.props.onChange(tags));
        }
    }
}