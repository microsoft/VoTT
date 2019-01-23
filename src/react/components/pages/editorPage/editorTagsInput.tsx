import React from "react";
import { TagsInput } from "vott-react";

/**
 * @name - Editor Tags Input
 * @description - Enhanced version of TagsInput. Allows for hot key display and two additional
 * click handlers (normal click and shift+click)
 */
export default class EditorTagsInput extends TagsInput {

    /**
     * Shows the of the tag in the span of the first 10 tags
     * @param name Name of tag
     */
    protected getTagSpan(name: string) {
        const index = this.indexOfTag(name);
        const showIndex = index <= 9;
        const className = `tag-span${(showIndex) ? " tag-span-index" : ""}`;
        return (
            <span className={className}>
                {(showIndex) ? `[${index}]  ` : ""}{name}
            </span>
        );
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
