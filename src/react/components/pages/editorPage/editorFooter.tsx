import React from "react";
import { TagEditorModal, TagsInput } from "vott-react";
import { strings } from "../../../../common/strings";
import { ITag } from "../../../../models/applicationState";

/**
 * Properties for Editor Footer
 * @member tags - Array of tags for TagsInput component
 * @member lockedTags - Tags currently locked for applying to regions
 * @member displayHotKeys - Determines whether indices for first 10 tags are shown on tag buttons
 * @member onTagsChanged - Function to call when tags are changed
 * @member onTagClicked - Function to call when tags are clicked
 */
export interface IEditorFooterProps {
    tags: ITag[];
    lockedTags: string[];
    onTagsChanged?: (value) => void;
    onTagClicked?: (value) => void;
    onCtrlTagClicked?: (value) => void;
    onCtrlShiftTagClicked?: (value) => void;
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

    public state = {
        tags: this.props.tags,
        selectedTag: null,
    };

    private tagsInput: React.RefObject<TagsInput> = React.createRef<TagsInput>();
    private tagEditorModal: React.RefObject<TagEditorModal> = React.createRef<TagEditorModal>();

    public componentDidUpdate(prevProp: IEditorFooterProps) {
        if (prevProp.tags !== this.props.tags) {
            this.setState({
                tags: this.props.tags,
            });
        }
    }

    public render() {
        return (
            <div>
                <TagsInput
                    tags={this.state.tags}
                    ref={this.tagsInput}
                    onChange={this.onTagsChanged}
                    onTagClick={this.onTagClicked}
                    onCtrlTagClick={this.props.onCtrlTagClicked}
                    onShiftTagClick={this.onShiftTagClicked}
                    onCtrlShiftTagClick={this.props.onCtrlShiftTagClicked}
                    getTagSpan={this.getTagSpan}
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

    private onTagClicked = (tag: ITag) => {
        this.props.onTagClicked(tag);
        this.blurTagsInput();
    }

    private onShiftTagClicked = (tag: ITag) => {
        this.setState({
            selectedTag: tag,
        }, () => {
            this.tagEditorModal.current.open(tag);
        });
    }

    private onTagModalOk = (oldTag: ITag, newTag: ITag) => {
        this.tagsInput.current.updateTag(oldTag, newTag);
        this.tagEditorModal.current.close();
    }

    private onTagsChanged = (tags) => {
        this.setState({
            tags,
        }, () => {
            this.props.onTagsChanged(this.state);
            this.blurTagsInput();
        });
    }

    /**
     * Shows the display index of the tag in the span of the first 10 tags
     * Also adds necessary stylings to all locked tags
     * @param name Name of tag
     * @param index Index of tag
     */
    private getTagSpan = (name: string, index: number) => {
        let className = "tag-span";
        let displayName = name;
        if (index < 10) {
            const displayIndex = (index === 9) ? 0 : index + 1;
            displayName = `[${displayIndex}]  ` + name;
            className += " tag-span-index";
        }
        if (this.props.lockedTags.find((t) => t === name)) {
            className += " locked-tag";
        }
        return (
            <span className={className}>{displayName}</span>
        );
    }

    private blurTagsInput() {
        const inputElement = document.querySelector(".ReactTags__tagInputField") as HTMLElement;
        if (inputElement) {
            setImmediate(() => inputElement.blur());
        }
    }
}
