import React from "react";
import formSchema from "./connectionForm.json";
import uiSchema from "./connectionForm.ui.json";
import Form from "react-jsonschema-form";
import { IConnection } from "../../../../redux/store/applicationState.js";
import LocalFolderPicker from "../../common/localFolderPicker";

interface IConnectionFormProps extends React.Props<ConnectionForm> {
    connection: IConnection;
    onSubmit: (connection: IConnection) => void;
}

interface IConnectionFormState {
    providerName: string;
    formSchema: any;
    uiSchema: any;
    formData: IConnection;
}

export default class ConnectionForm extends React.Component<IConnectionFormProps, IConnectionFormState> {
    private widgets = {
        localFolderPicker: LocalFolderPicker,
    };

    constructor(props, context) {
        super(props, context);

        this.state = {
            formSchema: { ...formSchema },
            uiSchema: { ...uiSchema },
            providerName: null,
            formData: this.props.connection,
        };

        this.onFormChange = this.onFormChange.bind(this);
    }

    public render() {
        return (
            <div className="app-connections-page-detail m-3 text-light">
                <h3><i className="fas fa-plug fa-1x"></i><span className="px-2">Connection Settings</span></h3>
                <hr />
                <Form
                    widgets={this.widgets}
                    schema={this.state.formSchema}
                    uiSchema={this.state.uiSchema}
                    formData={this.state.formData}
                    onChange={this.onFormChange}
                    onSubmit={(form) => this.props.onSubmit(form.formData)}>
                </Form>
            </div>

        );
    }

    public componentDidUpdate(prevProps) {
        if (prevProps.connection !== this.props.connection) {
            this.bindForm(this.props.connection);
        }
    }

    private onFormChange = (args) => {
        const providerType = args.formData.providerType;

        if (providerType !== this.state.providerName) {
            this.bindForm(args.formData, true);
        }
    }

    private bindForm(connection: IConnection, resetProviderOptions: boolean = false) {
        const providerType = connection ? connection.providerType : null;

        if (providerType) {
            const providerSchema = require(`../../../../providers/storage/${providerType}.json`);
            const providerUiSchema = require(`../../../../providers/storage/${providerType}.ui.json`);

            const formSchema = { ...this.state.formSchema };
            formSchema.properties["providerOptions"] = providerSchema;

            const uiSchema = { ...this.state.uiSchema };
            uiSchema["providerOptions"] = providerUiSchema;
        }

        const formData = { ...connection };
        if (resetProviderOptions) {
            formData.providerOptions = {};
        }

        this.setState({
            providerName: providerType,
            formSchema,
            uiSchema,
            formData,
        });
    }
}
