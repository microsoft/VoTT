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
    formData: any;
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
        debugger;

        this.state = {
            uiSchema: this.createUiSchema(),
            formSchema: { ...formSchema },
            formData: this.props.project,
        };
        this.onFormSubmit = this.onFormSubmit.bind(this);
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
                formData={this.state.formData}
                onSubmit={this.onFormSubmit}>
            </Form>
        );
    }

    private onFormSubmit(args) {
        debugger;
        this.props.onSubmit(args.formData)
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
