import React from "react";
import TagsInput, { ITagsInputProps, ITagsInputState } from "../../common/tagsInput/tagsInput";

export default class ProjectSettingsTagsInput extends TagsInput<ITagsInputProps> {

    protected getTagSpan(name: string) {
        return <span>{name}</span>;
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
        }
    }
}
