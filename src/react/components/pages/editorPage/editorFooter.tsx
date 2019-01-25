import React from "react";
import { ITag } from "../../../../models/applicationState";
import EditorTagsInput from "./editorTagsInput";
import { TagEditorModal } from "vott-react";
import { strings } from "../../../../common/strings";

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
    selectedTag: ITag;
}

/**
 * @name - Editor Footer
 * @description - Footer of the editor page. Contains EditorTagsInput component
 */
export default class EditorFooter extends React.Component<IEditorFooterProps, IEditorFooterState> {

    private editorTagsInput: React.RefObject<EditorTagsInput>;
    private tagEditorModal: React.RefObject<TagEditorModal>;

    constructor(props) {
        super(props);
        this.state = {
            tags: props.tags,
            selectedTag: null,
        };
        this.editorTagsInput = React.createRef<EditorTagsInput>();
        this.tagEditorModal = React.createRef<TagEditorModal>();

        this.onTagsChanged = this.onTagsChanged.bind(this);
        this.onCtrlTagClicked = this.onCtrlTagClicked.bind(this);
        this.onTagModalOk = this.onTagModalOk.bind(this);
    }

    public render() {
        return (
            <div>
                <EditorTagsInput
                    tags={this.state.tags}
                    onChange={this.onTagsChanged}
                    onTagClick={this.props.onTagClicked}
                    onCtrlTagClick={this.onCtrlTagClicked}
                />
                <TagEditorModal
                    ref={this.tagEditorModal}
                    onOk={this.onTagModalOk}
                    tagNameText={strings.tags.modal.name}
                    tagColorText={strings.tags.modal.color}
                    saveText={strings.common.save}
                    cancelText={strings.common.cancel}
                />
            </div>
        );
    }

    private onCtrlTagClicked(tag: ITag) {
        this.setState({
            selectedTag: tag,
        }, () => {
            this.tagEditorModal.current.open(tag);
        });
    }

    private onTagModalOk(oldTag: ITag, newTag: ITag) {
        this.editorTagsInput.current.updateTag(oldTag, newTag);
        this.tagEditorModal.current.close();
    }

    private onTagsChanged(tags) {
        this.setState({
            tags,
        }, () => this.props.onTagsChanged(this.state));
    }
}
