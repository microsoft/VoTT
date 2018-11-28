import React from 'react';
import formSchema from './projectForm.json';
import uiSchema from './projectForm.ui.json';
import Form from 'react-jsonschema-form'
import TagsInput from '../../common/tagsInput'
import ConnectionPicker from '../../common/connectionPicker';
import { IProject } from '../../../store/applicationState.js';


interface ProjectFormProps extends React.Props<ProjectForm> {
    project: IProject;
    onSubmit: (project: IProject) => void;
}

interface ProjectFormState {
    formSchema: any;
    uiSchema: any;
}

export default class ProjectForm extends React.Component<ProjectFormProps, ProjectFormState>{
    private widgets = {
        connectionPicker: ConnectionPicker,
        tagsInput: TagsInput
    }

    constructor(props, context) {
        super(props, context);

        this.state = {
            formSchema: { ...formSchema },
            uiSchema: { ...uiSchema }
        }
    }

    render() {
        return (
            <Form
                widgets={this.widgets}
                schema={this.state.formSchema}
                uiSchema={this.state.uiSchema}
                formData={this.props.project}
                onSubmit={this.props.onSubmit} >
            </Form>
        )
    }
}