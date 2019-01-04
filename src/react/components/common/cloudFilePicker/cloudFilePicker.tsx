import React from "react";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import { strings } from "../../../../common/strings";
import { IConnection, StorageType } from "../../../../models/applicationState";
import { StorageProviderFactory } from "../../../../providers/storage/storageProvider";
import CondensedList, { ListItem } from "../condensedList/condensedList";

export interface ICloudFilePickerProps {
    connections: IConnection[];
    onSubmit: (content: string) => void;

    onCancel?: () => void;
    fileExtension?: string;
}

export interface ICloudFilePickerState {
    isOpen: boolean;
    modalHeader: string;
    condensedList: any;
    selectedConnection: IConnection;
    selectedFile: string;
    okDisabled: boolean;
    backDisabled: boolean;
}

export class CloudFilePicker extends React.Component<ICloudFilePickerProps, ICloudFilePickerState> {

    constructor(props) {
        super(props);

        this.open = this.open.bind(this);
        this.close = this.close.bind(this);

        this.getInitialState = this.getInitialState.bind(this);
        this.handleOk = this.handleOk.bind(this);
        this.handleBack = this.handleBack.bind(this);
        this.connectionList = this.connectionList.bind(this);
        this.onClickConnection = this.onClickConnection.bind(this);
        this.fileList = this.fileList.bind(this);
        this.onClickFile = this.onClickFile.bind(this);

        this.state = this.getInitialState();
    }

    public render() {
        const closeBtn = <button className="close" onClick={this.close}>&times;</button>;

        return(
            <Modal isOpen={this.state.isOpen} centered={true}>
                <ModalHeader toggle={this.close} close={closeBtn}>
                    {this.state.modalHeader}
                </ModalHeader>
                <ModalBody>
                    {this.state.condensedList}
                </ModalBody>
                <ModalFooter>
                    {this.state.selectedFile || ""}
                    <Button
                        className="btn btn-success mr-1"
                        onClick={this.handleOk}
                        disabled={this.state.okDisabled}>
                        Ok
                    </Button>
                    <Button
                        onClick={this.handleBack}
                        disabled={this.state.backDisabled}>
                        Go Back
                    </Button>
                </ModalFooter>
            </Modal>
        );
    }

    public open(): void {
        this.setState({isOpen: true});
    }

    public close(): void {
        this.setState(this.getInitialState(),
            () => {
                if (this.props.onCancel) {
                    this.props.onCancel();
                }
            },
        );
    }

    private getInitialState(): ICloudFilePickerState {
        return {
            isOpen: false,
            modalHeader: strings.homePage.openCloudProject.selectConnection,
            condensedList: this.connectionList(),
            selectedConnection: null,
            selectedFile: null,
            okDisabled: true,
            backDisabled: true,
        };
    }

    private async handleOk() {
        if (this.state.selectedConnection && this.state.selectedFile) {
            const storageProvider = StorageProviderFactory.createFromConnection(this.state.selectedConnection);
            const content = await storageProvider.readText(this.state.selectedFile);
            this.props.onSubmit(content);
        }
    }

    private handleBack() {
        this.setState(this.getInitialState());
    }

    private getCondensedList(title: string, items: any[], onClick) {
        return <CondensedList
            title={title}
            items={items}
            Component={ListItem}
            onClick={onClick}
        />;
    }

    private getCloudConnections(connections: IConnection[]): IConnection[] {
        return connections.filter((connection) => connection.connectionType === StorageType.CLOUD);
    }

    private connectionList() {
        const connections = this.getCloudConnections(this.props.connections);
        return this.getCondensedList("Cloud Connections", connections, (args) => this.onClickConnection(args));
    }

    private async onClickConnection(args) {
        const connection: IConnection = {
            ...args,
        };
        const fileList = await this.fileList(connection);
        this.setState({
            selectedConnection: connection,
            modalHeader: `Select a file from "${connection.name}"`,
            condensedList: fileList,
            backDisabled: false,
        });
    }

    private async fileList(connection: IConnection) {
        const storageProvider = StorageProviderFactory.createFromConnection(connection);
        const files = await storageProvider.listFiles(
            connection.providerOptions["containerName"],
            this.props.fileExtension);
        const fileItems = [];
        for (let i = 0; i < files.length; i++) {
            fileItems.push({
                id: `file-${i + 1}`,
                name: files[i],
            });
        }
        return this.getCondensedList(
            `${this.props.fileExtension || "All"} Files in "${connection.name}"`,
            fileItems,
            this.onClickFile,
        );
    }

    private onClickFile(args) {
        const fileName = args.name;
        this.setState({
            selectedFile: fileName,
            okDisabled: false,
        });
    }
}
