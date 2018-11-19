import React from 'react';
import Form from 'react-jsonschema-form'
import formSchema from './schemas/connectionsPage.json';

export interface IConnectionPageProps {

}

export interface IConnectionPageState {
    formSchema: any,
    providerName: string,
    formData: any
}

export default class ConnectionPage extends React.Component<IConnectionPageProps, IConnectionPageState> {
    constructor(props, context) {
        super(props, context);

        this.state = {
            formSchema: { ...formSchema },
            providerName: null,
            formData: {}
        };

        this.onPageFormChange = this.onPageFormChange.bind(this);
    }

    componentDidMount = () => {

    }

    onPageFormChange = (args) => {
        const storageProvider = args.formData.storageProvider;

        if (storageProvider !== this.state.providerName) {
            const providerSchema = require(`../../providers/storage/${storageProvider}.json`);
            const formSchema = { ...this.state.formSchema };
            formSchema.properties['providerOptions'] = providerSchema;

            this.setState({
                providerName: storageProvider,
                formSchema: formSchema,
                formData: { ...args.formData, providerOptions: {} }
            });
        }
    };

    onProviderFormSubmit = (args) => {
        console.log(args);
    }

    render() {
        return (
            <div className="m-3 text-light">
                <h3><i className="fas fa-cog fa-1x"></i><span className="px-2">Connection Settings</span></h3>
                <Form
                    schema={this.state.formSchema}
                    formData={this.state.formData}
                    onChange={this.onPageFormChange}>
                </Form>
            </div>
        );
    }
}
