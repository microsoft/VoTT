import React from "react";
import Form from "react-jsonschema-form";
import deepmerge from "deepmerge";
import TagsInput from "../../common/tagsInput/tagsInput";
import ConnectionPicker from "../../common/connectionPicker";
import { IProject, IConnection } from "../../../../models/applicationState.js";
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
    private widgets = {
        connectionPicker: ConnectionPicker,
        tagsInput: TagsInput,
    };

    constructor(props, context) {
        super(props, context);
        const normalizedTags = this.normalizeTags(this.props.project);
        this.state = {
            uiSchema: this.createUiSchema(),
            formSchema: { ...formSchema },
            formData: {
                ...this.props.project,
                tags: normalizedTags,
            },
        };
        this.onFormSubmit = this.onFormSubmit.bind(this);
        this.onTagsChange = this.onTagsChange.bind(this);
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
                schema={this.state.formSchema}
                uiSchema={this.state.uiSchema}
                formData={this.state.formData}
                onSubmit={this.onFormSubmit}>
            </Form>
        );
    }

    private onTagsChange(tagsJson) {
        this.setState({
            formData: {
                ...this.state.formData,
                tags: tagsJson,
            },
        });
    }

    private onFormSubmit(args) {
        this.props.onSubmit(args.formData);
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
            tags: {
                "ui:widget": (props) => {
                    return (
                        <TagsInput
                            tags={this.state.formData.tags}
                            onChange={this.onTagsChange} />
                    );
                },
            },
        };

        return deepmerge(uiSchema, overrideUiSchema);
    }

    private normalizeTags(project: IProject) {
        if (project && project.tags) {
            return JSON.stringify(project.tags);
        }
        return undefined;
    }
}
