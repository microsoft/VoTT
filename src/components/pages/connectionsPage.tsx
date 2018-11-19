import React from 'react';
import Form from 'react-jsonschema-form'

const pageSchema = require('./schemas/connectionsPage.json');

export interface IConnectionPageProps {

}

export interface IConnectionPageState {
    pageSchema: any,
    providerName: string,
    providerSchema: any
}

export default class ConnectionPage extends React.Component<IConnectionPageProps, IConnectionPageState> {
    constructor(props, context) {
        super(props, context);

        this.state = {
            pageSchema: pageSchema,
            providerName: null,
            providerSchema: null
        }

        this.onPageFormChange = this.onPageFormChange.bind(this);
    }

    componentDidMount = () => {

    }

    onPageFormChange = (args) => {
        if (args.formData.storageProvider) {
            this.setProviderForm(args.formData.storageProvider);
        }
    };

    onProviderFormChange = (args) => {
    }

    onProviderFormSubmit = (args) => {
        console.log(args);
    }

    setProviderForm(providerName: string) {
        if (this.state.providerName !== providerName) {
            this.setState({
                providerName: providerName,
                providerSchema: require(`../../providers/storage/${providerName}.json`)
            });
        }
    }

    render() {
        return (
            <div className="m-3 text-light">
                <h3><i className="fas fa-cog fa-1x"></i><span className="px-2">Connection Settings</span></h3>
                <Form schema={this.state.pageSchema}
                    onChange={this.onPageFormChange} />

                {this.state.providerSchema &&
                    <Form schema={this.state.providerSchema}
                        onSubmit={this.onProviderFormSubmit} />}
            </div>
        );
    }
}
