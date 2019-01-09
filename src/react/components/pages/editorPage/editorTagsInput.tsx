import { ITag } from "../../../../models/applicationState";
import TagsInput, { ITagsInputProps } from "../../common/tagsInput/tagsInput";
import React from "react";

export interface IEditorTagsInputProps extends ITagsInputProps {
    onTagClick?: (tag: ITag) => void;
    onTagShiftClick?: (tag: ITag) => void;
}

export default class EditorTagsInput extends TagsInput<IEditorTagsInputProps> {

    /**
     * Shows the of the tag in the span of the first 10 tags
     * @param name Name of tag
     */
    protected getTagSpan(name: string) {
        const index = this.indexOfTag(name);
        return (
            <span className="tag-span">
                {(index <= 9) ? `[${index}]  ` : ""}{name}
            </span>
        );
    }

    /**
     * Calls the onTagClick handler if not null with clicked tag
     * @param event Click event
     */
    protected handleTagClick(event) {
        const text = this.getTagText(event);
        const tag = this.getTag(text);
        if (event.ctrlKey) {
            this.openEditModal(tag);
        } else if (event.shiftKey && this.props.onTagShiftClick) {
            // Calls provided onTagShiftClick
            this.props.onTagShiftClick(this.toItag(tag));
        } else if (this.props.onTagClick) {
            // Calls provided onTagClick function
            this.props.onTagClick(this.toItag(tag));
        }
    }

    private indexOfTag(id: string): number {
        let index = -1;
        if (this.state) {
            index = this.state.tags.findIndex((tag) => tag.id === id);
            if (index < 0) {
                index = this.state.tags.length + 1;
            }
        } else {
            index = this.props.tags.findIndex((tag) => tag.name === id);
        }
        if (index < 0) {
            throw new Error(`No tag by id: ${id}`);
        }
        index += 1;
        return (index === 10) ? 0 : index;
    }
}
