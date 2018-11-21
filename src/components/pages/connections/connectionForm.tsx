import React from 'react';
import formSchema from './connectionsPage.json';
import Form from 'react-jsonschema-form'
import { IConnection } from '../../../store/applicationState.js';

interface ConnectionFormProps extends React.Props<ConnectionForm> {
    connection: IConnection;
    onSubmit: (connection: IConnection) => void;
}

interface ConnectionFormState {
    providerName: string;
    formSchema: any;
    formData: IConnection;
}

export default class ConnectionForm extends React.Component<ConnectionFormProps, ConnectionFormState> {
    constructor(props, context) {
        super(props, context);

        this.state = {
            formSchema: { ...formSchema },
            providerName: null,
            formData: this.props.connection
        };

        this.onFormChange = this.onFormChange.bind(this);
    }

    componentDidUpdate(prevProps) {
        if (prevProps.connection !== this.props.connection) {
            this.bindForm(this.props.connection);
        }
    }

    onFormChange = (args) => {
        const providerType = args.formData.providerType;

        if (providerType !== this.state.providerName) {
            this.bindForm(args.formData, true);
        }
    };

    private bindForm(connection: IConnection, resetProviderOptions: boolean = false) {
        const providerType = connection.providerType;
        const providerSchema = require(`../../../providers/storage/${providerType}.json`);
        const formSchema = { ...this.state.formSchema };
        formSchema.properties['providerOptions'] = providerSchema;

        const formData = { ...connection };
        if (resetProviderOptions) {
            formData.providerOptions = {};
        }

        this.setState({
            providerName: providerType,
            formSchema: formSchema,
            formData: formData
        });
    }

    render() {
        return (
            <div className="app-connections-page-detail m-3 text-light">
                <h3><i className="fas fa-plug fa-1x"></i><span className="px-2">Connection Settings</span></h3>
                <hr />
                <Form
                    schema={this.state.formSchema}
                    formData={this.state.formData}
                    onChange={this.onFormChange}
                    onSubmit={(form) => this.props.onSubmit(form.formData)}>
                </Form>
            </div>

        );
    }
}