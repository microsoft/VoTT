import React from 'react';
import Form from 'react-jsonschema-form'

const schema = {
    title: "Add Storage Connection",
    required: ['displayName'],
    type: "object",
    properties: {
        displayName: {
            title: "Display Name",
            type: "string"
        },
        storageProvider: {
            title: "Provider",
            type: "string",
            enum: [
                "azure-blob-storage",
                "local"
            ],
            default: "azure-blob-storage",
            enumNames: [
                "Azure Blob Storage",
                "Local Directory"
            ]
        },
        connectionString: {
            title: "Connection String",
            type: "string"
        },
        containerName: {
            title: "Container Name",
            type: "string"
        },
        createContainer: {
            title: "Create Container",
            type: "boolean"
        }
    }
}

const uiSchema = {
    displayName: {
        "ui:autofocus": true,
        "ui:placeholder": "My Data Connection"
    },
    connectionString: {
        "ui:autofocus": true,
        "ui:placeholder": "DefaultEndpointsProtocol=https;AccountName=myblobstorage;AccountKey=ABC123"
    },
    containerName: {
        "ui:autofocus": true,
        "ui:placeholder": "my-container"
    }
}

const log = (type) => console.log.bind(console, type);

export default class ConnectionPage extends React.Component {

    onChange = (data) => {
        log("changed");
    }

    onSubmit = (data) => {
        log("submitted");
    }

    onError = (data) => {
        log("error");
    }

    render() {
        return (
            <Form schema={schema}
                uiSchema={uiSchema}
                onChange={this.onChange}
                onSubmit={this.onSubmit}
                onError={this.onError} />
        );
    }
}
