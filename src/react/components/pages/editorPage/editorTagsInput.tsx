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
        const index = this.indexOfTag(name); // get index from function below
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
        if (this.state) { // if state exists
            index = this.state.tags.findIndex((tag) => tag.id === id); // return index based on tag.id or -1
            if (index < 0) { // if not found, i.e. -1
                index = this.state.tags.length + 1; // create new final array index and assign to index, i.e. 2 or 3
            }
        } else { // if there is no state
            index = this.props.tags.findIndex((tag) => tag.name === id); // check tags in props and return index or -1
        }
        if (index < 0) { // if neither of the above were triggered, throw error
            throw new Error(`No tag by id: ${id}`);
        }
        index += 1; // whatever the index, increment by one to avoid zero-base in display
        return (index === 10) ? 0 : index; // return index or 0, because max hotkeys are 10
    }
}
