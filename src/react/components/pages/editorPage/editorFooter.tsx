import React from "react";
import { ITag } from "../../../../models/applicationState";
import EditorTagsInput from "./editorTagsInput";

/**
 * Properties for Editor Footer
 * @member tags - Array of tags for TagsInput component
 * @member displayHotKeys - Determines whether indices for first 10 tags are shown on tag buttons
 * @member onTagsChanged - Function to call when tags are changed
 * @member onTagClicked - Function to call when tags are clicked
 */
export interface IEditorFooterProps {
    tags: ITag[];
    displayHotKeys: boolean;
    onTagsChanged?: (value) => void;
    onTagClicked?: (value) => void;
}

/**
 * State for Editor Footer
 * @member tags - Array of tags for TagsInput component
 */
export interface IEditorFooterState {
    tags: ITag[];
}

/**
 * @name - Editor Footer
 * @description - Footer of the editor page. Contains EditorTagsInput component
 */
export default class EditorFooter extends React.Component<IEditorFooterProps, IEditorFooterState> {
    constructor(props) {
        super(props);
        this.state = {
            tags: props.tags,
        };
        this.onTagsChanged = this.onTagsChanged.bind(this);
    }

    public render() {
        return (
            <div>
                <EditorTagsInput
                    tags={this.state.tags}
                    onChange={this.onTagsChanged}
                    onTagClick={this.props.onTagClicked}
                />
            </div>
        );
    }

    private onTagsChanged(tags) {
        this.setState({
            tags,
        }, () => this.props.onTagsChanged(this.state));
    }
}
