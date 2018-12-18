import deepmerge from "deepmerge";
import React from "react";
import Form from "react-jsonschema-form";
import { IConnection, IProject } from "../../../../models/applicationState.js";
import ConnectionPicker from "../../common/connectionPicker";
import TagsInput from "../../common/tagsInput/tagsInput";
// tslint:disable-next-line:no-var-requires
const formSchema = require("./projectForm.json");
// tslint:disable-next-line:no-var-requires
const uiSchema = require("./projectForm.ui.json");

/**
 * Required properties for Project Settings form
 * project: IProject - project to fill form
 * connections: IConnection[] - array of connections to use in project
 * onSubmit: function to call on form submit
 */
export interface IProjectFormProps extends React.Props<ProjectForm> {
    project: IProject;
    connections: IConnection[];
    onSubmit: (project: IProject) => void;
}

/**
 * Project Form State
 * formData - data containing details of project
 * formSchema - json schema of form
 * uiSchema - json UI schema of form
 */
export interface IProjectFormState {
    formData: any;
    formSchema: any;
    uiSchema: any;
}

/**
 * Form for editing or creating VoTT projects
 */
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
            formData: {
                ...this.props.project,
            },
        };
        this.onFormSubmit = this.onFormSubmit.bind(this);
    }
    /**
     * Updates state if project from properties has changed
     * @param prevProps - previously set properties
     */
    public componentDidUpdate(prevProps) {
        if (prevProps.project !== this.props.project) {
            this.setState({
                formData: { ...this.props.project },
            });
        }

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
                fields={{tagsInput: TagsInput}}
                formData={this.state.formData}
                onSubmit={this.onFormSubmit}>
            </Form>
        );
    }

    /**
     * Called when form is submitted
     */
    private onFormSubmit(args: IProjectFormState) {
        const project: IProject = {
            ...args.formData,
        };
        this.props.onSubmit(project);
    }

    /**
     * Dynamically create UI schema by loading available connections
     */
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
