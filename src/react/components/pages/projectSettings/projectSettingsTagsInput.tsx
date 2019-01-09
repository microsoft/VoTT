import React from "react";
import TagsInput, { ITagsInputProps } from "../../common/tagsInput/tagsInput";

export default class ProjectSettingsTagsInput extends TagsInput<ITagsInputProps> {

    protected getTagSpan(name: string) {
        return <span>{name}</span>;
    }

    /**
     * Calls the onTagClick handler if not null with clicked tag
     * @param event Click event
     */
    protected handleTagClick(event) {
        const text = (event.currentTarget.innerText || event.target.innerText).trim();
        const tag = this.getTag(text);
        if (event.ctrlKey) {
            this.openEditModal(tag);
        }
    }
}
