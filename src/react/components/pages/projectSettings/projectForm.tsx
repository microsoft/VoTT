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

export default class ProjectForm extends React.Component<IProjectFormProps, IProjectFormState> {
    private fields = {
        connection: CustomField(ConnectionPicker, (props) => {
            return {
                id: props.idSchema.$id,
                value: props.formData,
                connections: this.props.connections,
                onChange: props.onChange,
            };
        }),
        tagsInput: CustomField(TagsInput, (props) => {
            return {
                tags: props.formData,
                onChange: props.onChange,
            };
        }),
    };

    constructor(props, context) {
        super(props, context);
        this.state = {
            uiSchema: { ...uiSchema },
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
    }

    public render() {
        return (
            <Form
                fields={this.fields}
                schema={this.state.formSchema}
                uiSchema={this.state.uiSchema}
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
}
