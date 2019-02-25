import React, { SyntheticEvent } from "react";
import shortid from "shortid";
import HtmlFileReader from "../../../../common/htmlFileReader";
import { IFileInfo } from "../../../../models/applicationState";

/**
 * Properties for File Picker
 * @member onChange - Function to call on change of file selection
 * @member onError - Function to call on file picking error
 */
export interface IFilePickerProps {
    onChange: (sender: SyntheticEvent, fileText: IFileInfo) => void;
    onError: (sender: SyntheticEvent, error: any) => void;
}

/**
 * @name - File Picker
 * @description - Pick file from local file system
 */
export default class FilePicker extends React.Component<IFilePickerProps> {
    private fileInput;

    constructor(props, context) {
        super(props, context);

        this.fileInput = React.createRef();
        this.onFileUploaded = this.onFileUploaded.bind(this);
    }

    /**
     * Call click on current file input
     */
    public upload = () => {
        this.fileInput.current.click();
    }

    public render() {
        return (
            <input id={shortid.generate()} ref={this.fileInput} type="file" onChange={this.onFileUploaded} />
        );
    }

    private onFileUploaded = (e) => {
        if (e.target.files.length === 0) {
            this.props.onError(e, "No files were selected");
        }

        HtmlFileReader.readAsText(e.target.files[0])
            .then((fileInfo) => this.props.onChange(e, fileInfo))
            .catch((err) => this.props.onError(e, err));
    }
}
