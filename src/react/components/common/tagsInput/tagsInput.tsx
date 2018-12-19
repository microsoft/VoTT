import React from "react";
import "./tagsInput.scss";
import "../common.scss";
import { WithContext as ReactTags } from "react-tag-input";
import { randomIntInRange } from "../../../../common/utils";
import { TagEditorModal } from "./tagEditorModal/tagEditorModal";
import deepmerge from "deepmerge";
import { ITag } from "../../../../models/applicationState";
// tslint:disable-next-line:no-var-requires
const TagColors = require("./tagColors.json");

/**
 * Interface for model required to work with lower level
 * tags input component. Rather than name, uses 'id'.
 * Requires text attribute, which is used to inject
 * HTML to customize the tags
 */
export interface IReactTag {
    id: string;
    text: any;
    color: string;
}

/**
 * Properties required for TagsInput component
 * tags - ITag[] or stringified ITag[]
 * onChange - function to call on tags change
 */
export interface ITagsInputProps {
    tags: ITag[];
    onChange: (tags: ITag[]) => void;
}

/**
 * Current state of tags input component
 * tags - IReactTag[] - tags used in lower level component
 * currentTagColorIndex - rotates initial color to apply to tags
 * selectedTag - tag that was most recently double clicked,
 *     used to populate modal
 * showModal - boolean to show tag editor modal or not
 */
export interface ITagsInputState {
    tags: IReactTag[];
    currentTagColorIndex: number;
    selectedTag: IReactTag;
    showModal: boolean;
}

/**
 * Key codes used within tag input component
 * comma - 188 (delimiter for new tag)
 * enter - 13 (delimiter for new tag)
 * backspace - 8 (override deletion of tags)
 */
export const KeyCodes = {
    comma: 188,
    enter: 13,
    backspace: 8,
};

/**
 * Keys that, when pressed, cause creation of new tag
 */
const delimiters = [KeyCodes.comma, KeyCodes.enter];

export default class TagsInput extends React.Component<ITagsInputProps, ITagsInputState> {

    constructor(props) {
        super(props);

        this.state = {
            tags: this.getReactTags(this.props.tags),
            currentTagColorIndex: randomIntInRange(0, TagColors.length),
            selectedTag: null,
            showModal: false,
        };

        this.handleDelete = this.handleDelete.bind(this);
        this.handleAddition = this.handleAddition.bind(this);
        this.handleDrag = this.handleDrag.bind(this);
        this.handleTagDoubleClick = this.handleTagDoubleClick.bind(this);
        this.handleEditedTag = this.handleEditedTag.bind(this);
        this.handleCloseModal = this.handleCloseModal.bind(this);
        this.getTag = this.getTag.bind(this);
        this.toItag = this.toItag.bind(this);
        this.toReactTag = this.toReactTag.bind(this);
    }

    public render() {
        const { tags } = this.state;
        return (
            <div>
                <ReactTags tags={tags}
                    handleDelete={this.handleDelete}
                    handleAddition={this.handleAddition}
                    handleDrag={this.handleDrag}
                    delimiters={delimiters} />
                <TagEditorModal
                    tag={this.toItag(this.state.selectedTag)}
                    showModal={this.state.showModal}
                    onOk={this.handleEditedTag}
                    onCancel={this.handleCloseModal}
                />
            </div>
        );
    }

    public componentDidUpdate(prevProps: ITagsInputProps) {
        if (prevProps.tags !== this.props.tags) {
            this.setState({
                tags: this.getReactTags(this.props.tags),
            });
        }
    }
    /**
     * Update an existing tag, called after clicking 'OK' in modal
     * @param newTag Edited version of tag
     */
    private handleEditedTag(newTag: ITag): void {
        const newReactTag = this.toReactTag(newTag);
        /**
         * If this was a name change (ids are not equal), don't allow
         * the new tag to be named with a name that currently exists
         * in other tags. Probably should include an error message.
         * For now, just doesn't allow the action to take place. Modal
         * won't close and user won't be able to set the name. This is
         * similar to how the component handles duplicate naming at the
         * creation level. If user enters name that already exists in
         * tags, the component just doesn't do anything.
         */
        if (newReactTag.id !== this.state.selectedTag.id && this.state.tags.some((t) => t.id === newReactTag.id)) {
            return;
        }
        this.addHtml(newReactTag);
        this.setState((prevState) => {
            return {
                tags: prevState.tags.map((reactTag) => {
                    if (reactTag.id === prevState.selectedTag.id) {
                        reactTag = newReactTag;
                    }
                    return reactTag;
                }),
                showModal: false,
            };
        }, () => this.props.onChange(this.normalize(this.state.tags)));
    }

    /**
     * Set showModal to false
     */
    private handleCloseModal(): void {
        this.setState({
            showModal: false,
        });
    }

    /**
     * Adds new tag to state with necessary HTML for rendering
     * Sets the color of the tag to next color, rotates through each
     * @param reactTag - IReactTag - new tag to add to state
     */
    private handleAddition(reactTag: IReactTag): void {
        reactTag.color = TagColors[this.state.currentTagColorIndex];
        this.addHtml(reactTag);
        this.setState((prevState) => {
            return {
                tags: [...this.state.tags, reactTag],
                currentTagColorIndex: (prevState.currentTagColorIndex + 1) % TagColors.length,
            };
        }, () => this.props.onChange(this.normalize(this.state.tags)));
    }

    /**
     * Sets the selected tag and shows the modal for editing tag
     * @param event Double click event
     */
    private handleTagDoubleClick(event) {
        let text = event.currentTarget.innerText;
        if (!text) {
            text = event.target.innerText;
        }
        const tag = this.getTag(text);
        this.setState({
            selectedTag: tag,
            showModal: true,
        });
    }

    /**
     * Allows for click-and-drag re-ordering of tags
     * @param tag Tag being dragged
     * @param currPos Current position of tag
     * @param newPos New position of tag
     */
    private handleDrag(tag: IReactTag, currPos: number, newPos: number): void {
        const tags = [...this.state.tags];
        const newTags = tags.slice();

        newTags.splice(currPos, 1);
        newTags.splice(newPos, 0, tag);

        this.setState({ tags: newTags },
            () => this.props.onChange(this.normalize(this.state.tags)));
    }

    /**
     * Deletes tag from state
     * Explicitly prevents deletion with backspace key
     * @param i index of tag being deleted
     * @param event delete event
     */
    private handleDelete(i: number, event): void {
        if (event.keyCode === KeyCodes.backspace) {
            return;
        }
        const { tags } = this.state;
        this.setState((prevState) => {
            return {
                tags: tags.filter((tag, index) => index !== i),
            };
        }, () => this.props.onChange(this.normalize(this.state.tags)));
    }

    /**
     * Gets the tag with the given name (id)
     * @param id string name of tag. param 'id' for lower level react component
     */
    private getTag(id: string): IReactTag {
        const match = this.state.tags.find((tag) => tag.id === id);
        if (!match) {
            throw new Error(`No tag by id: ${id}`);
        }

        return match;
    }

    /**
     * Adds necessary HTML for tag to render correctly
     * @param tag tag needing Html
     */
    private addHtml(tag: IReactTag): void {
        tag.text = this.ReactTagHtml(tag.id, tag.color);
    }

    /**
     * Gets ITag[] from props and converts it to IReactTag[]
     * @param props properties for component, contains tags in ITag format
     */
    private getReactTags(tags: ITag[]): IReactTag[] {
        return tags ? tags.map((element: ITag) => this.toReactTag(element)) : [];
    }

    /**
     * Converts ITag to IReactTag
     * @param tag ITag to convert to IReactTag
     */
    private toReactTag(tag: ITag): IReactTag {
        if (!tag) {
            return null;
        }
        return {
            id: tag.name,
            text: this.ReactTagHtml(tag.name, tag.color),
            color: tag.color,
        };
    }

    /**
     * Converts IReactTag to ITag
     * @param tag IReactTag to convert to ITag
     */
    private toItag(tag: IReactTag): ITag {
        if (!tag) {
            return null;
        }
        return {
            name: tag.id,
            color: tag.color,
        };
    }

    /**
     * Generate necessary HTML to render tag box appropriately
     * @param name name of tag
     * @param color color of tag
     */
    private ReactTagHtml(name: string, color: string) {
        return <div className="inline-block tagtext" onDoubleClick={(event) => this.handleTagDoubleClick(event)}>
                    <div className={"inline-block tag_color_box"}
                        style={{
                            backgroundColor: color,
                        }}></div>
                    <span>{name}</span>
                </div>;
    }

    /**
     * Convert array of IReactTags to ITags
     * @param tags array of IReactTags to convert to ITags
     */
    private normalize(tags: IReactTag[]): ITag[] {
        return tags.map((element: IReactTag) => this.toItag(element));
    }
}
