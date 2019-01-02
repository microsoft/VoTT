import React from "react";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import { IConnection, ICloudConnection, IProject } from "../../../models/applicationState";
import { IStorageProvider, StorageProviderFactory } from "../../../providers/storage/storageProvider";
import CondensedList, { ListItem } from "./condensedList/condensedList";
import { constants } from "../../../common/constants";

export interface ICloudFilePickerProps {
    isOpen: boolean;
    connections: IConnection[];
    onCancel: () => void;
    onSubmit: (project: IProject) => void;
}

export interface ICloudFilePickerState {
    modalHeader: string;
    condensedList: any;
    selectedConnection: ICloudConnection;
    selectedFile: string;
    okDisabled: boolean;
    backDisabled: boolean;
}

export class CloudFilePicker extends React.Component<ICloudFilePickerProps, ICloudFilePickerState> {

    constructor(props) {
        super(props);

        this.getInitialState = this.getInitialState.bind(this);
        this.handleOk = this.handleOk.bind(this);
        this.handleBack = this.handleBack.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.connectionList = this.connectionList.bind(this);
        this.onClickConnection = this.onClickConnection.bind(this);
        this.fileList = this.fileList.bind(this);
        this.onClickFile = this.onClickFile.bind(this);

        this.state = this.getInitialState();        
    }

    public render() {
        const closeBtn = <button className="close" onClick={this.handleClose}>&times;</button>;

        return(
            <div>
                <Modal isOpen={this.props.isOpen} centered={true}>
                    <ModalHeader toggle={this.props.onCancel} close={closeBtn}>
                        {this.state.modalHeader}
                    </ModalHeader>
                    <ModalBody>
                        {this.state.condensedList}
                    </ModalBody>
                    <ModalFooter>
                        {this.state.selectedFile || ""}
                        <Button onClick={this.handleOk} disabled={this.state.okDisabled}>Ok</Button>
                        <Button onClick={this.handleBack} disabled={this.state.backDisabled}>Go Back</Button>

                    </ModalFooter>
                </Modal>
            </div>
        );
    }

    private getInitialState(): ICloudFilePickerState {
        return {
            modalHeader: "Select a Connection",
            condensedList: this.connectionList(),
            selectedConnection: null,
            selectedFile: null,
            okDisabled: true,
            backDisabled: true,
        }
    }

    private async handleOk() {
        if (this.state.selectedConnection && this.state.selectedFile) {
            const storageProvider = this.getStorageProvider(this.state.selectedConnection);
            const content = await storageProvider.readText(this.state.selectedFile);
            const project: IProject = JSON.parse(content);
            this.props.onSubmit(project);
        }
    }

    private handleBack() {
        this.setState(this.getInitialState());
    }

    private handleClose() {
        this.setState(this.getInitialState());
        this.props.onCancel();
    }

    private getCondensedList(title: string, items: any[], onClick) {
        return <CondensedList
            title={title}
            items={items}
            Component={ListItem}
            onClick={onClick}
        />;
    }

    private connectionList() {
        const connections = this.props.connections;
        return this.getCondensedList("Connections", connections, (args) => this.onClickConnection(args));
    }

    private async onClickConnection(args) {
        const connection: ICloudConnection = {
            ...args,
        };
        const fileList = await this.fileList(connection);
        this.setState({
            selectedConnection: connection,
            modalHeader: `Select a project file from "${connection.name}"`,
            condensedList: fileList,
            backDisabled: false,
        });
    }

    private async fileList(connection: ICloudConnection) {
        const files = await this.getStorageProvider(connection).listFiles(
            connection.providerOptions.containerName,
            constants.projectFileExtension);
        const fileItems = [];
        for (let i = 0; i < files.length; i++) {
            fileItems.push({
                id: `file-${i + 1}`,
                name: files[i],
            });
        }
        return this.getCondensedList("Project Files", fileItems, this.onClickFile);
    }

    private onClickFile(args) {
        const fileName = args.name;
        this.setState({
            selectedFile: fileName,
            okDisabled: false,
        });

    }

    private getStorageProvider(connection: ICloudConnection): IStorageProvider {
        return StorageProviderFactory.create(
            connection.providerType,
            connection.providerOptions,
        );
    }
}
