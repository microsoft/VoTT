import React from "react";
import { TagEditorModal, TagsInput } from "vott-react";
import { strings } from "../../../../common/strings";
import { ITag } from "../../../../models/applicationState";

/**
 * Properties for Editor Footer
 * @member tags - Array of tags for TagsInput component
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

    private tagsInput: React.RefObject<TagsInput>;
    private tagEditorModal: React.RefObject<TagEditorModal>;

    constructor(props) {
        super(props);
        this.state = {
            tags: props.tags,
            selectedTag: null,
        };
        this.tagsInput = React.createRef<TagsInput>();
        this.tagEditorModal = React.createRef<TagEditorModal>();

        this.onTagsChanged = this.onTagsChanged.bind(this);
        this.onShiftTagClicked = this.onShiftTagClicked.bind(this);
        this.onTagModalOk = this.onTagModalOk.bind(this);
    }

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
                    onTagClick={this.props.onTagClicked}
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

    private onShiftTagClicked(tag: ITag) {
        this.setState({
            selectedTag: tag,
        }, () => {
            this.tagEditorModal.current.open(tag);
        });
    }

    private onTagModalOk(oldTag: ITag, newTag: ITag) {
        this.tagsInput.current.updateTag(oldTag, newTag);
        this.tagEditorModal.current.close();
    }

    private onTagsChanged(tags) {
        this.setState({
            tags,
        }, () => this.props.onTagsChanged(this.state));
    }

    /**
     * Shows the of the tag in the span of the first 10 tags
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
}
