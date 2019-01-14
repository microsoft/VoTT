import React from "react";
import { ITag } from "../../../../models/applicationState";
import EditorTagsInput from "./editorTagsInput";
import { debug } from "util";

export interface IEditorFooterProps {
    tags: ITag[];
    displayHotKeys: boolean;
    onTagsChanged?: (value) => void;
    onTagClicked?: (value) => void;
}

export interface IEditorFooterState {
    tags: ITag[];
}

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
                    displayHotKeys={this.props.displayHotKeys}
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
