import React from "react";
import CondensedList from "../condensedList/condensedList";
import { ITag } from "../../../../models/applicationState";
import { strings } from "../../../../common/strings";
import { VerticalTagInputItem } from "./verticalTagInputItem";
import "./verticalTagInput.scss";
import { ITagMetadata } from "vott-react";



export interface IVerticalTagInputProps {
    tags: ITag[];
}

export interface IVerticalTagInputState {
    tags: ITag[];
}

export class VerticalTagInput extends React.Component<IVerticalTagInputProps, IVerticalTagInputState> {

    state = {
        tags: this.props.tags || [],
    }


    render() {
        return (
            <div>
                <CondensedList
                    title={strings.tags.title}
                    Component={VerticalTagInputItem}
                    items={this.getListItems()}
                    onClick={(item, e) => this.handleClick(item, e)}
                    onDelete={(tag) => this.handleDelete(tag)}
                />
                <input type="text" onKeyPress={this.handleKeyPress} placeholder="Add new tag"></input>
            </div>
        )
    }

    private getListItems = (): ITagMetadata[] => {
        return this.state.tags.map((tag) => {
            return {
                ...tag,
                index: this.state.tags.findIndex((t) => t.name === tag.name)
            }
        })
    }

    private handleClick = (tag, e?) => {
        debugger;
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