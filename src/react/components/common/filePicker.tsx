import React, { SyntheticEvent } from "react";
import shortid from "shortid";
import HtmlFileReader from "../../../common/htmlFileReader";

interface IFilePickerProps {
    ref: React.RefObject<FilePicker>;
    onChange: (sender: SyntheticEvent, fileText: string | ArrayBuffer) => void;
    onError: (sender: SyntheticEvent, error: any) => void;
}

export default class FilePicker extends React.Component<IFilePickerProps> {
    private fileInput;

    constructor(props, context) {
        super(props, context);

        this.fileInput = React.createRef();
        this.onFileUploaded = this.onFileUploaded.bind(this);
    }

    public upload = () => {
        this.fileInput.current.click();
    }

    public render() {
        return (
            <input id={shortid.generate()} ref={this.fileInput} type="file" onChange={this.onFileUploaded} />
        );
    }

    private onFileUploaded = (e) => {
        if (e.currentTarget.files.length === 0) {
            this.props.onError(e, "No files were selected");
        }

        const reader = new HtmlFileReader();
        reader.readAsText(e.currentTarget.files[0])
            .then((fileText) => this.props.onChange(e, fileText))
            .catch((err) => this.props.onError(e, err));
    }
}
