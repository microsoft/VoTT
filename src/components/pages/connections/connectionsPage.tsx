import React from 'react';
import Form from 'react-jsonschema-form'
import formSchema from '../schemas/connectionsPage.json';
import ConnectionItem from './connectionItem';
import CondensedList from '../../common/condensedList';
import './connectionsPage.scss';

export interface IConnectionPageProps {

}

export interface IConnectionPageState {
    formSchema: any,
    providerName: string,
    formData: any,
    connections: any[]
}

export default class ConnectionPage extends React.Component<IConnectionPageProps, IConnectionPageState> {
    constructor(props, context) {
        super(props, context);

        this.state = {
            formSchema: { ...formSchema },
            providerName: null,
            formData: {},
            connections: [
                { id: 1, name: 'Connection 1' },
                { id: 2, name: 'Connection 2' },
                { id: 3, name: 'Connection 3' },
                { id: 4, name: 'Connection 4' },
            ]
        };

        this.onFormChange = this.onFormChange.bind(this);
        this.onFormSubmit = this.onFormSubmit.bind(this);
    }

    componentDidMount = () => {

    }

    onFormChange = (args) => {
        const storageProvider = args.formData.storageProvider;

        if (storageProvider !== this.state.providerName) {
            const providerSchema = require(`../../../providers/storage/${storageProvider}.json`);
            const formSchema = { ...this.state.formSchema };
            formSchema.properties['providerOptions'] = providerSchema;

            this.setState({
                providerName: storageProvider,
                formSchema: formSchema,
                formData: { ...args.formData, providerOptions: {} }
            });
        }
    };

    onFormSubmit = (args) => {
        console.log(args);
    }

    render() {
        return (
            <div className="app-connections-page">
                <div className="app-connections-page-list bg-lighter-1">
                    <CondensedList
                        title="Connections"
                        Component={ConnectionItem}
                        items={this.state.connections} />
                </div>
                <div className="app-connections-page-detail m-3 text-light">
                    <h3><i className="fas fa-plug fa-1x"></i><span className="px-2">Connection Settings</span></h3>
                    <hr />
                    <Form
                        schema={this.state.formSchema}
                        formData={this.state.formData}
                        onChange={this.onFormChange}
                        onSubmit={this.onFormSubmit}>
                    </Form>
                </div>
            </div>
        );
    }
}
