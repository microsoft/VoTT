import React from "react";
import { LocalFileSystemProxy } from "../../../../providers/storage/localFileSystemProxy";
import { strings } from "../../../../common/strings";

/**
 * Properties for Local Folder Picker
 * @member id - ID for HTML form control element
 * @member value - Initial value for picker
 * @member onChange - Function to call on change to selected value
 */
interface ILocalFolderPickerProps {
    id?: string;
    value: string;
    onChange: (value) => void;
}

/**
 * State for Local Folder Picker
 * @member value - Selected folder
 */
interface ILocalFolderPickerState {
    value: string;
}

/**
 * @name - Local Folder Picker
 * @description - Select folder from local file system
 */
export default class LocalFolderPicker extends React.Component<ILocalFolderPickerProps, ILocalFolderPickerState> {
    private localFileSystem: LocalFileSystemProxy;

    constructor(props, context) {
        super(props, context);

        this.state = {
            value: this.props.value || "",
        };

        this.localFileSystem = new LocalFileSystemProxy();
        this.selectLocalFolder = this.selectLocalFolder.bind(this);
    }

    public render() {
        const { id } = this.props;
        const { value } = this.state;

        return (
            <div className="input-group">
                <input id={id} type="text" className="form-control" value={value} readOnly={true} />
                <div className="input-group-append">
                    <button className="btn btn-primary"
                        type="button"
                        onClick={this.selectLocalFolder}>{strings.connections.providers.local.selectFolder}
                    </button>
                </div>
            </div>
        );
    }

    public componentDidUpdate(prevProps) {
        if (prevProps.value !== this.props.value) {
            this.setState({
                value: this.props.value,
            });
        }
    }

    private selectLocalFolder = async () => {
        const filePath = await this.localFileSystem.selectContainer();
        if (filePath) {
            this.setState({
                value: filePath,
            }, () => this.props.onChange(filePath));
        }
    }
}
