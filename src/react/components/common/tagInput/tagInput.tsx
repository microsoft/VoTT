import React from "react";
import { strings } from "../../../../common/strings";
import { ITag } from "../../../../models/applicationState";
import CondensedList from "../condensedList/condensedList";
import "./tagInput.scss";
import TagInputItem, { ITagItemProps } from "./tagInputItem";
import { randomIntInRange } from "../../../../common/utils";
import TagInputToolbar from "./tagInputToolbar";
// tslint:disable-next-line:no-var-requires
const tagColors = require("../../common/tagColors.json");

export interface ITagInputProps {
    /** Current list of tags */
    tags: ITag[];
    /** Function called on tags change */
    onChange: (tags: ITag[]) => void;
    /** Tags that are currently locked for editing experience */
    lockedTags?: string[];
    /** Updates to locked tags */
    onLockedTagsChange?: (locked: string[]) => void;
    /** Place holder for input text box */
    placeHolder?: string;
    /** Function to call on clicking individual tag */
    onTagClick?: (tag: ITag) => void;
    /** Function to call on clicking individual tag while holding CTRL key */
    onCtrlTagClick?: (tag: ITag) => void;
}

export interface ITagInputState {
    tags: ITag[];
    selectedTag: ITag;
    editingTag: ITag;
    tagEditMode: TagEditMode;
}

export enum TagEditMode {
    Color = "color",
    Name = "name",
}

export class TagInput extends React.Component<ITagInputProps, ITagInputState> {

    public state = {
        tags: this.props.tags || [],
        selectedTag: null,
        editingTag: null,
        tagEditMode: null,
    };

    public render() {
        return (
            <div className="vertical-tag-input">
                <CondensedList
                    title={strings.tags.title}
                    Component={TagInputItem}
                    displayEmptyMessage={false}
                    Toolbar={<TagInputToolbar
                        selectedTag={this.state.selectedTag}
                        onEditTag={this.onEditTag}
                        onLockTag={this.onLockTag}
                        onDelete={this.deleteTag}
                        onReorder={this.onReOrder}/>}
                    items={this.getListItems()}
                    onDelete={(item) => this.deleteTag(item.tag)}
                />
                <input className="tag-input-box" type="text"
                    onKeyPress={this.handleKeyPress} placeholder="Add new tag"/>
            </div>
        );
    }

    private onEditTag = (tag: ITag) => {
        if (!tag) {
            return;
        }
        const editingTag = this.state.editingTag;
        this.setState({
            editingTag: (editingTag && editingTag.name === tag.name) ? null : tag,
        });
    }

    private onLockTag = (tag: ITag) => {
        if (!tag) {
            return;
        }
        let lockedTags = [...this.props.lockedTags];
        if (lockedTags.find((t) => t === tag.name)) {
            lockedTags = lockedTags.filter((t) => t !== tag.name);
        } else {
            lockedTags.push(tag.name);
        }
        this.props.onLockedTagsChange(lockedTags);
    }

    private onReOrder = (tag: ITag, displacement: number) => {
        if (!tag) {
            return;
        }
        const tags = [...this.state.tags];
        const currentIndex = tags.indexOf(tag);
        let newIndex = currentIndex + displacement;
        if (newIndex < 0) {
            newIndex = 0;
        } else if (newIndex >= tags.length) {
            newIndex = tags.length - 1;
        }
        tags.splice(currentIndex, 1);
        tags.splice(newIndex, 0, tag);
        this.setState({
            tags,
        }, () => this.props.onChange(tags));
    }

    private updateTag = (oldTag: ITag, newTag: ITag) => {
        const tags = this.state.tags.map((t) => {
            return (t.name === oldTag.name) ? newTag : t;
        });
        this.setState({
            tags,
            editingTag: null,
            selectedTag: newTag,
        }, () => {
            this.props.onChange(tags);
        });
    }

    private getListItems = (): ITagItemProps[] => {
        const tags = this.state.tags;
        return tags.map((tag) => {
            const item: ITagItemProps = {
                tag,
                index: tags.findIndex((t) => t.name === tag.name),
                isLocked: this.props.lockedTags && this.props.lockedTags.findIndex((t) => t === tag.name) > -1,
                isSelected: this.state.selectedTag && this.state.selectedTag.name === tag.name,
                isBeingEdited: this.state.editingTag && this.state.editingTag.name === tag.name,
                tagEditMode: this.state.tagEditMode,
                onClick: this.handleClick,
                onChange: this.updateTag,
            };
            return item;
        });
    }

    private handleClick = (e, tag: ITag, clickTarget: TagEditMode) => {
        if (e.ctrlKey && this.props.onCtrlTagClick) {
            this.props.onCtrlTagClick(tag);
        } else if (e.altKey) {
            // Open edit mode
            this.setState({
                editingTag: tag,
                selectedTag: null,
                tagEditMode: clickTarget,
            });
        } else {
            const editingTag = this.state.editingTag;
            const selectedTag = this.state.selectedTag;

            const inEditMode = editingTag && tag && tag.name === editingTag.name;

            this.setState({
                editingTag: (editingTag && tag && tag.name !== editingTag.name) ? null : editingTag,
                selectedTag: (selectedTag && selectedTag.name === tag.name && !inEditMode) ? null : tag,
                tagEditMode: clickTarget,
            });

            if (this.props.onTagClick && !inEditMode) {
                this.props.onTagClick(tag);
            }
        }
    }

    private deleteTag = (tag: ITag) => {
        if (!tag) {
            return;
        }
        const index = this.state.tags.indexOf(tag);
        const tags = this.state.tags.filter((t) => t.name !== tag.name);
        this.setState({
            tags,
            selectedTag: this.getNewSelectedTag(tags, index),
        }, () => this.props.onChange(tags));
        if (this.props.lockedTags.find((l) => l === tag.name)) {
            this.props.onLockedTagsChange(
                this.props.lockedTags.filter((lockedTag) => lockedTag !== tag.name),
            );
        }
    }

    private getNewSelectedTag = (tags: ITag[], previouIndex: number): ITag => {
        return (tags.length) ? tags[Math.min(tags.length - 1, previouIndex)] : null;
    }

    private handleKeyPress = (event) => {
        if (event.key === "Enter") {
            // validate and add
            const newTag: ITag = {
                name: event.target.value,
                color: this.getNextColor(),
            };
            if (newTag.name.length && !this.state.tags.find((t) => t.name === newTag.name)) {
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
            return tagColors[newIndex];
        } else {
            return tagColors[0];
        }
    }

    private addTag = (tag: ITag) => {
        if (!this.state.tags.find((t) => t.name === tag.name)) {
            const tags = [...this.state.tags, tag];
            this.setState({
                tags,
            }, () => this.props.onChange(tags));
        }
    }
}
