import React from 'react'
import './tagsInput.scss'
import { WithContext as ReactTags } from 'react-tag-input';


interface TagsInputProps {
    tags: any;
    onChange: (value) => void;
}

interface TagsInputState {
    tags: any;
}

const KeyCodes = {
    comma: 188,
    enter: 13,
};

const delimiters = [KeyCodes.comma, KeyCodes.enter];

export default class TagsInput extends React.Component<TagsInputProps, TagsInputState> {
    constructor(props) {
        super(props);

        this.state = {
            tags: []
        }
        this.handleDelete = this.handleDelete.bind(this);
        this.handleAddition = this.handleAddition.bind(this);
        this.handleDrag = this.handleDrag.bind(this);
    }

    convertToFlatList(tags) {
        return tags.map(element => element.text).join();
    }

    handleAddition = (tag) => {
        this.setState({
            tags: [...this.state.tags, tag]
        }, () => this.props.onChange(this.convertToFlatList(this.state.tags)));
    }

    handleDelete = (i) => {
        const { tags } = this.state;
        this.setState({
            tags: tags.filter((tag, index) => index !== i),
        }, () => this.props.onChange(this.convertToFlatList(this.state.tags)));
    }

    handleDrag = (tag, currPos, newPos) => {
        const tags = [...this.state.tags];
        const newTags = tags.slice();

        newTags.splice(currPos, 1);
        newTags.splice(newPos, 0, tag);

        // re-render
        this.setState({ tags: newTags },
            () => this.props.onChange(this.convertToFlatList(this.state.tags)));
    }

    render() {
        const { tags } = this.state;
        return (
            <div>
                <ReactTags tags={tags}
                    handleDelete={this.handleDelete}
                    handleAddition={this.handleAddition}
                    handleDrag={this.handleDrag}
                    delimiters={delimiters} />
            </div>
        )
    }

}