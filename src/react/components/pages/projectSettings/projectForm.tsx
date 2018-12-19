import deepmerge from "deepmerge";
import React from "react";
import Form from "react-jsonschema-form";
import { IConnection, IProject, ITag } from "../../../../models/applicationState.js";
import ConnectionPicker from "../../common/connectionPicker";
import TagsInput from "../../common/tagsInput/tagsInput";
import CustomField from "../../common/customField";
// tslint:disable-next-line:no-var-requires
const formSchema = require("./projectForm.json");
// tslint:disable-next-line:no-var-requires
const uiSchema = require("./projectForm.ui.json");

export interface IProjectFormProps extends React.Props<ProjectForm> {
    project: IProject;
    connections: IConnection[];
    onSubmit: (project: IProject) => void;
}

export interface IProjectFormState {
    formData: any;
    formSchema: any;
    uiSchema: any;
}

const fields = {tagsInput: TagsInput};

export default class ProjectForm extends React.Component<IProjectFormProps, IProjectFormState> {
    private widgets = {
        connectionPicker: ConnectionPicker,
        tagsInput: TagsInput,
    };

    private fields = {
        connection: CustomField(ConnectionPicker, (props) => {
            return {
                value: props.formData,
                connections: this.props.connections,
                onChange: props.onChange,
            };
        }),
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
                fields={this.fields}
                schema={this.state.formSchema}
                uiSchema={this.state.uiSchema}
                fields={fields}
                formData={this.state.formData}
                onSubmit={this.onFormSubmit}>
            </Form>
        );
    }

    private onFormSubmit(args) {
        const project: IProject = {
            ...args.formData,
        };
        this.props.onSubmit(project);
    }

    private createUiSchema(): any {
        const overrideUiSchema = {
        };
        return deepmerge(uiSchema, overrideUiSchema);
    }
}
