import React from "react";
import "./tagsInput.scss";
import "../common.scss";
import tagColors from "./tagColors.json";
import { WithContext as ReactTags } from "react-tag-input";
import { randomIntInRange } from "../../../../common/utils";
import { TagEditorModal } from "./tagEditorModal/tagEditorModal";
import deepmerge from "deepmerge";
import { ITag } from "../../../../models/applicationState";

export interface IReactTag {
    id: string;
    text: any;
    color: string;
}

interface ITagsInputProps {
    tags: ITag[] | string;
    onChange: (value) => void;
}

interface ITagsInputState {
    tags: IReactTag[];
    currentTagColorIndex: number;
    selectedTag: IReactTag;
    showModal: boolean;
}

const KeyCodes = {
    comma: 188,
    enter: 13,
    backspace: 8,
};

const delimiters = [KeyCodes.comma, KeyCodes.enter];

export default class TagsInput extends React.Component<ITagsInputProps, ITagsInputState> {

    constructor(props) {
        super(props);

        this.state = {
            tags: this.getReactTags(props),
            currentTagColorIndex: randomIntInRange(0, tagColors.length),
            selectedTag: null,
            showModal: false,
        };

        this.handleDelete = this.handleDelete.bind(this);
        this.handleAddition = this.handleAddition.bind(this);
        this.handleDrag = this.handleDrag.bind(this);
        this.handleTagClick = this.handleTagClick.bind(this);
        this.handleEditedTag = this.handleEditedTag.bind(this);
        this.handleCloseModal = this.handleCloseModal.bind(this);
        this.getTag = this.getTag.bind(this);
        this.toItag = this.toItag.bind(this);
        this.toReactTag = this.toReactTag.bind(this);
    }

    public render() {
        const { tags } = this.state;
        return (
            <div>
                <ReactTags tags={tags}
                    handleDelete={this.handleDelete}
                    handleAddition={this.handleAddition}
                    handleDrag={this.handleDrag}
                    delimiters={delimiters}/>
                <TagEditorModal
                    tag={this.toItag(this.state.selectedTag)}
                    showModal={this.state.showModal}
                    onOk={this.handleEditedTag}
                    onCancel={this.handleCloseModal}
                />
            </div>
        );
    }

    public handleEditedTag(newTag: ITag): void {
        const newReactTag = this.toReactTag(newTag);
        if (newReactTag.id !== this.state.selectedTag.id && this.state.tags.some((t) => t.id === newReactTag.id)) {
            return;
        }
        this.addHtml(newReactTag);
        this.setState((prevState) => {
            return {
                tags: prevState.tags.map((reactTag) => {
                    if (reactTag.id === prevState.selectedTag.id) {
                        reactTag = newReactTag;
                    }
                    return reactTag;
                }),
                showModal: false,
            };
        }, () => this.props.onChange(this.normalize(this.state.tags)));
    }

    private handleCloseModal(): void {
        this.setState({
            showModal: false,
        });
    }

    private handleAddition(reactTag: IReactTag): void {
        reactTag.color = tagColors[this.state.currentTagColorIndex];
        this.addHtml(reactTag);
        this.setState((prevState) => {
            return {
                tags: [...this.state.tags, reactTag],
                currentTagColorIndex: (prevState.currentTagColorIndex + 1) % tagColors.length,
            };
        }, () => this.props.onChange(this.normalize(this.state.tags)));
    }

    private handleTagClick(event) {
        let text = event.currentTarget.innerText;
        if (!text) {
            text = event.target.innerText;
        }
        const tag = this.getTag(text);
        this.setState({
            selectedTag: tag,
            showModal: true,
        });
    }

    private handleDrag(tag: IReactTag, currPos: number, newPos: number): void {
        const tags = [...this.state.tags];
        const newTags = tags.slice();

        newTags.splice(currPos, 1);
        newTags.splice(newPos, 0, tag);

        this.setState({ tags: newTags },
            () => this.props.onChange(this.normalize(this.state.tags)));
    }

    private handleDelete(i: number, event): void {
        if (event.keyCode === KeyCodes.backspace) {
            return;
        }
        const { tags } = this.state;
        this.setState((prevState) => {
            return {
                tags: tags.filter((tag, index) => index !== i),
            };
        }, () => this.props.onChange(this.normalize(this.state.tags)));
    }

    private getTag(id: string): IReactTag {
        const {tags} = this.state;
        for (const tag of tags) {
            if (tag.id === id) {
                return tag;
            }
        }
        throw new Error("No tag by name: " + id);
    }

    private addHtml(tag: IReactTag): void {
        tag.text = this.ReactTagHtml(tag.id, tag.color);
    }

    private getReactTags(props): IReactTag[] {
        const tags = props.tags;
        const iTags = (typeof tags === "string") ? JSON.parse(tags) : tags;
        return (iTags) ? iTags.map((element: ITag) => this.toReactTag(element)) : [];
    }

    private toReactTag(tag: ITag): IReactTag {
        if (!tag) {
            return null;
        }
        return {
            id: tag.name,
            text: this.ReactTagHtml(tag.name, tag.color),
            color: tag.color,
        };
    }

    private ReactTagHtml(name: string, color: string) {
        return <div className="inline-block tagtext" onDoubleClick={(event) => this.handleTagClick(event)}>
                    <div className={"inline-block tag_color_box"}
                        style={{
                            backgroundColor: color,
                        }}></div>
                    <span>{name}</span>
                </div>;
    }

    private toItag(tag: IReactTag): ITag {
        if (!tag) {
            return null;
        }
        return {
            name: tag.id,
            color: tag.color,
        };
    }

    private normalize(tags): string {
        const itags = tags.map((element: IReactTag) => this.toItag(element));
        return JSON.stringify(itags);
    }
}
