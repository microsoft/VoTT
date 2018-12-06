import React from "react";
import Form from "react-jsonschema-form";
import deepmerge from "deepmerge";
import formSchema from "./projectForm.json";
import uiSchema from "./projectForm.ui.json";
import TagsInput from "../../common/tagsInput/tagsInput";
import ConnectionPicker from "../../common/connectionPicker";
import { IProject, IConnection } from "../../../../models/applicationState.js";

interface IProjectFormProps extends React.Props<ProjectForm> {
    project: IProject;
    connections: IConnection[];
    onSubmit: (project: IProject) => void;
}

interface IProjectFormState {
    formSchema: any;
    uiSchema: any;
}

export default class ProjectForm extends React.Component<IProjectFormProps, IProjectFormState> {
    private widgets = {
        connectionPicker: ConnectionPicker,
        tagsInput: TagsInput,
    };

    constructor(props, context) {
        super(props, context);

        this.state = {
            uiSchema: this.createUiSchema(),
            formSchema: { ...formSchema },
        };
    }

    public componentDidUpdate(prevProps) {
        if (prevProps.connections !== this.props.connections) {
            this.setState({
                uiSchema: this.createUiSchema(),
            });
        }
    }

    public render() {
        return (
            <Form
                widgets={this.widgets}
                schema={this.state.formSchema}
                uiSchema={this.state.uiSchema}
                formData={this.props.project}
                onSubmit={this.props.onSubmit}>
            </Form>
        );
    }

    private createUiSchema(): any {
        const overrideUiSchema = {
            sourceConnectionId: {
                "ui:options": {
                    connections: this.props.connections,
                },
            },
            targetConnectionId: {
                "ui:options": {
                    connections: this.props.connections,
                },
            },
        };

        return deepmerge(uiSchema, overrideUiSchema);
    }
}
