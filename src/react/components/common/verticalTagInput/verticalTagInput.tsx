import React from "react";
import CondensedList from "../condensedList/condensedList";
import { ITag, ITagMetadata } from "../../../../models/applicationState";
import { strings } from "../../../../common/strings";
import VerticalTagInputItem from "./verticalTagInputItem";
import "./verticalTagInput.scss";
import CanvasHelpers from "../../pages/editorPage/canvasHelpers";



export interface IVerticalTagInputProps {
    /** Current list of tags */
    tags: ITag[];
    /** Tags that are currently locked for editing experience */
    lockedTags: string[];
    onChange: (tags: ITag[]) => void;
    /** Place holder for input text box.
     * @default New Tag
     */
    placeHolder?: string;
    /** Key code delimiters for creating a new tag */
    delimiters?: number[];
    /** Colors for tags */
    tagColors?: { [id: string]: string };
    /** Function to call on clicking individual tag */
    onTagClick?: (tag: ITag) => void;
    /** Function to call on clicking individual tag while holding CTRL key */
    onCtrlTagClick?: (tag: ITag) => void;
    /** Function to call on clicking individual tag while holding Shift key */
    onShiftTagClick?: (tag: ITag) => void;
    /** Function to call on clicking individual tag while holding CTRL and Shift keys */
    onCtrlShiftTagClick?: (tag: ITag) => void;
}

export interface IVerticalTagInputState {
    tags: ITag[];
    selectedTag: ITag;
    editingTag: ITag;
}

export class VerticalTagInput extends React.Component<IVerticalTagInputProps, IVerticalTagInputState> {

    state = {
        tags: this.props.tags || [],
        lockedTags: [],
        selectedTag: null,
        editingTag: null,
    }


    render() {
        return (
            <div>
                <CondensedList
                    title={strings.tags.title}
                    Component={VerticalTagInputItem}
                    items={this.getListItems()}
                    onClick={(item, e) => this.handleClick(item, e)}
                    onChange={(oldItem, newItem) => this.updateTag(oldItem, newItem)}
                    onDelete={(tag) => this.handleDelete(tag)}
                />
                <input type="text" onKeyPress={this.handleKeyPress} placeholder="Add new tag"/>
            </div>
        )
    }

    private updateTag = (oldTag: ITag, newTag: ITag) => {
        debugger;
    } 

    private getListItems = (): ITagMetadata[] => {
        const tags = this.state.tags;
        return tags.map((tag) => {
            const tagMetadata = {
                ...tag,
                index: tags.findIndex((t) => t.name === tag.name),
                isLocked: this.props.lockedTags.findIndex((t) => t === tag.name) > -1,
                editMode: this.state.editingTag && this.state.editingTag.name === tag.name,
            }
            return tagMetadata;
        })
    }

    private handleClick = (tag: ITag, e?) => {
        if (e.shiftKey) {
            this.setState({
                editingTag: tag,
                selectedTag: null,
            });
        } else {
            if (tag.name !== this.state.editingTag.name) {
                this.setState({
                    selectedTag: tag,
                    editingTag: null,
                });
                if (this.props.onTagClick) {
                    this.props.onTagClick(tag);
                }
            }
        }
    }

    private handleDelete = (tag) => {
        debugger;
    }

    private handleKeyPress = (event) => {
        if (event.key === "Enter") {
            //validate and add
            const newTag: ITag = {
                name: event.target.value,
                color: "#ffffff",
            }
            if (!this.state.tags.find((t) => t.name === newTag.name)) {
                this.addTag(newTag);
                event.target.value = "";
            } else {
                // toast that tells them to pick another name
            }
        }
    }

    private addTag = (tag: ITag) => {
        if (!this.state.tags.find((t) => t.name === tag.name)) {
            this.setState({
                tags: [...this.state.tags, tag]
            });
        }
    }
}