import React, { ReactElement, ReactInstance } from "react";
import ReactDOM from "react-dom";
import Align from "rc-align";
import { randomIntInRange } from "../../../../common/utils";
import { IRegion, ITag } from "../../../../models/applicationState";
import { ColorPicker } from "../colorPicker";
import "./tagInput.scss";
import TagInputItem, { ITagInputItemProps } from "./tagInputItem";
import TagInputToolbar from "./tagInputToolbar";
// tslint:disable-next-line:no-var-requires
const tagColors = require("../../common/tagColors.json");

export interface ITagInputProps {
    /** Current list of tags */
    tags: ITag[];
    /** Function called on tags change */
    onChange: (tags: ITag[]) => void;
    /** Containing component ref */
    containerRef?: ReactInstance;
    /** Currently selected regions in canvas */
    selectedRegions?: IRegion[];
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
    /** Function to call when tag is renamed */
    onTagRenamed?: (oldTag: string, newTag: string) => void;
    /** Function to call when tag is deleted */
    onTagDeleted?: (tag: ITag) => void;
    /** Always show tag input box */
    showTagInputBox?: boolean;
    /** Always show tag search box */
    showSearchBox?: boolean;
}

export interface ITagInputState {
    tags: ITag[];
    clickedColor: boolean;
    showColorPicker: boolean;
    addTags: boolean;
    searchTags: boolean;
    searchQuery: string;
    selectedTag: ITag;
    editingTag: ITag;
}

export class TagInput extends React.Component<ITagInputProps, ITagInputState> {

    public state: ITagInputState = {
        tags: this.props.tags || [],
        clickedColor: false,
        showColorPicker: false,
        addTags: this.props.showTagInputBox,
        searchTags: this.props.showSearchBox,
        searchQuery: "",
        selectedTag: null,
        editingTag: null,
    };

    private tagItemRefs: {[id: string]: TagInputItem} = {};
    private colorPickerWidth: number = 137;

    public render() {
        return (
            <div className="tag-input condensed-list">
                <h6 className="condensed-list-header bg-darker-2 p-2">
                    <span className="condensed-list-title">Tags</span>
                    <TagInputToolbar
                        selectedTag={this.state.selectedTag}
                        onAddTags={() => this.setState({addTags: !this.state.addTags})}
                        onSearchTags={() => this.setState({
                            searchTags: !this.state.searchTags,
                            searchQuery: "",
                        })}
                        onEditTag={this.onEditTag}
                        onLockTag={this.onLockTag}
                        onDelete={this.deleteTag}
                        onReorder={this.onReOrder}
                    />
                </h6>
                <div className="condensed-list-body">
                    {
                        this.state.searchTags &&
                        <div className="tag-input-text-input-row search-input">
                            <input
                                type="text"
                                onChange={(e) => this.setState({searchQuery: e.target.value})}
                                placeholder="Search tags"
                                autoFocus={true}
                            />
                        </div>
                    }
                    <div className="tag-input-color-picker">
                        {this.getColorPickerPortal()}
                    </div>
                    <div className="tag-input-items">
                        {this.getTagItems()}
                    </div>
                    {
                        this.state.addTags &&
                        <div className="tag-input-text-input-row new-tag-input">
                            <input
                                className="tag-input-box"
                                type="text"
                                onKeyDown={this.handleKeyDown}
                                placeholder="Add new tag"
                                autoFocus={true}
                            />
                        </div>
                    }
                </div>
            </div>
        );
    }

    public componentDidUpdate(prevProps: ITagInputProps) {
        if (prevProps.tags !== this.props.tags) {
            this.setState({
                tags: this.props.tags,
            });
        }
    }

    private onEditTag = (tag: ITag) => {
        if (!tag) {
            return;
        }
        const editingTag = this.state.editingTag;
        this.setState({
            editingTag: (editingTag && editingTag.name === tag.name) ? null : tag,
        });
        if (this.state.clickedColor) {
            this.setState({
                showColorPicker: !this.state.showColorPicker,
            });
        }
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
        const newIndex = currentIndex + displacement;
        if (newIndex < 0 || newIndex >= tags.length) {
            return;
        }
        tags.splice(currentIndex, 1);
        tags.splice(newIndex, 0, tag);
        this.setState({
            tags,
        }, () => this.props.onChange(tags));
    }

    private handleColorChange = (color: string) => {
        const tag = this.state.editingTag;
        const tags = this.state.tags.map((t) => {
            return (t.name === tag.name) ? {name: t.name, color} : t;
        });
        this.setState({
            tags,
            editingTag: null,
            showColorPicker: false,
        }, () => this.props.onChange(tags));
    }

    private updateTag = (oldTag: ITag, newTag: ITag) => {
        if (oldTag === newTag) {
            return;
        }
        if (newTag.name !== oldTag.name && this.state.tags.some((t) => t.name === newTag.name)) {
            return;
        }
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

    private getColorPickerCoordinates = () => {
        const tagCoords = this.getTagCoordinates();
        return tagCoords ?
            {
                top: tagCoords.top + 28,
                left: tagCoords.left - this.colorPickerWidth + 23,
            } : {top: 0, left: 0};
    }

    private getTagCoordinates = () => {
        const tag = this.state.editingTag;
        if (tag) {
            const node = ReactDOM.findDOMNode(this.tagItemRefs[tag.name]) as Element;
            if (node) {
                const rect = node.getBoundingClientRect();
                return {
                    top: rect.top,
                    left: rect.left,
                };
            }
        }
    }

    private getTagTarget = () => {
        const tag = this.state.editingTag;
        if (tag) {
            const node = ReactDOM.findDOMNode(this.tagItemRefs[tag.name]) as Element;
            if (node) {
                return node;
            }
        }
        return document;
    }

    private getColorPickerPortal = () => {
                        <Align align={this.getAlignConfig()} target={this.getTagTarget}>
            <ColorPicker
                color={this.state.editingTag && this.state.editingTag.color}
                colors={tagColors}
                onEditColor={this.handleColorChange}
                show={this.state.showColorPicker}
                coordinates={this.getColorPickerCoordinates()}
                width={this.colorPickerWidth}
            />
                        </Align>
    }

    private getAlignConfig = () => {
        return {
            points: ["tl", "tr"],
            offset: [10, 20],
            targetOffset: ["30%", "40%"],
            overflow: {adjustX: true, adjustY: true}
        }
    }

    private getTagItems = () => {
        let props = this.getTagItemProps();
        const query = this.state.searchQuery;
        if (query.length) {
            props = props.filter((prop) => prop.tag.name.includes(query));
        }
        return props.map((prop) =>
            <TagInputItem
                ref={(item) => this.tagItemRefs[prop.tag.name] = item}
                {...prop}
            />);
    }

    private getTagItemProps = (): ITagInputItemProps[] => {
        const tags = this.state.tags;
        const selectedRegionTagSet = this.getSelectedRegionTagSet();
        return tags.map((tag) => {
            const item: ITagInputItemProps = {
                tag,
                index: tags.findIndex((t) => t.name === tag.name),
                isLocked: this.props.lockedTags && this.props.lockedTags.findIndex((t) => t === tag.name) > -1,
                isBeingEdited: this.state.editingTag && this.state.editingTag.name === tag.name,
                isSelected: this.state.selectedTag && this.state.selectedTag.name === tag.name,
                appliedToSelectedRegions: selectedRegionTagSet.has(tag.name),
                onClick: this.handleClick,
                onChange: this.updateTag,
            };
            return item;
        });
    }

    private getSelectedRegionTagSet = (): Set<string> => {
        const result = new Set<string>();
        if (this.props.selectedRegions) {
            for (const region of this.props.selectedRegions) {
                for (const tag of region.tags) {
                    result.add(tag);
                }
            }
        }
        return result;
    }

    private onAltClick = (tag: ITag, clickedColor: boolean) => {
        this.setState({
            editingTag: tag,
            clickedColor,
            showColorPicker: !this.state.showColorPicker,
        });
    }

    private handleClick = (tag: ITag, ctrlKey, altKey, clickedColor?: boolean) => {
        if (ctrlKey && this.props.onCtrlTagClick) {
            this.props.onCtrlTagClick(tag);
            this.setState({clickedColor});
        } else if (altKey) {
            this.onAltClick(tag, clickedColor);
        } else {
            const { editingTag, selectedTag } = this.state;
            const inEditMode = editingTag && tag.name === editingTag.name;
            const alreadySelected = selectedTag && selectedTag.name === tag.name;

            this.setState({
                editingTag: inEditMode ? null : editingTag,
                selectedTag: (alreadySelected && !inEditMode) ? null : tag,
                clickedColor,
                showColorPicker: false,
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

    private handleKeyDown = (event) => {
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
