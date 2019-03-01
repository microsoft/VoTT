import React from "react";
import { TagsInput, ITagsInputProps } from "vott-react";

/**
 * @name - Editor Tags Input
 * @description - Enhanced version of TagsInput. Allows for hot key display and two additional
 * click handlers (normal click and shift+click)
 */
export default class EditorTagsInput extends React.Component<ITagsInputProps> {

    /**
     * Shows the of the tag in the span of the first 10 tags
     * @param name Name of tag
     * @param index Index of tag
     */
    protected getTagSpan(name: string, index: number) {
        const displayIndex = (index === 9) ? 0 : index + 1;
        const showIndex = index < 10;
        const className = `tag-span${(showIndex) ? " tag-span-index" : ""}`;
        return (
            <span className={className}>
                {(showIndex) ? `[${index}]  ` : ""}{name}
            </span>
        );
    }

    render() {
        return (
            <TagsInput 
                {...this.props}
                getTagSpan={this.getTagSpan}
            />
        )
    }
}
