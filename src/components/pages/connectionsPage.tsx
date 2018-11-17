import React from 'react';
import Form from 'react-jsonschema-form'

const schema = require('./schemas/connectionsPage.json');
const uiSchema = require('./schemas/ui/connectionsPage.json');

const log = (type) => console.log.bind(console, type);

export default class ConnectionPage extends React.Component {

    render() {
        return (
            <Form schema={schema}
                uiSchema={uiSchema}
                onChange={log("changed")}
                onSubmit={log("submitted")}
                onError={log("error")} />
        );
    }
}
