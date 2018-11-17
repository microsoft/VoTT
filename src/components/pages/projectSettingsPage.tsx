import React from 'react';
import Form from 'react-jsonschema-form'

const schema = require('./schemas/projectSettingsPage.json');
const uiSchema = require('./schemas/ui/projectSettingsPage.json');

export default class ProjectSettingsPage extends React.Component {
    render() {
        return (
            <Form schema={schema} 
            uiSchema={uiSchema}/>
        );
    }
}
