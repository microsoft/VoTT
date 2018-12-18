import deepmerge from "deepmerge";
import React from "react";
import Form from "react-jsonschema-form";
import { IConnection, IProject, ITag } from "../../../../models/applicationState.js";
import ConnectionPicker from "../../common/connectionPicker";
import TagsInput from "../../common/tagsInput/tagsInput";
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
    tags: ITag[];
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
            formData: {
                ...this.props.project
            },
            tags: (this.props.project) ? this.props.project.tags : null
        };
        this.onFormSubmit = this.onFormSubmit.bind(this);
        // this.onFormChange = this.onFormChange.bind(this);
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
                // noValidate={true}
                // onChange={this.onFormChange}
                onSubmit={this.onFormSubmit}>
            </Form>
        );
    }

    private onTagsChange(tags) {
        this.setState({tags});
    }

    // private onFormChange(args) {
    //     if(args.formData !== this.state.formData){
    //         this.setState({formData: args.formData});
    //     }
    // }

    private onFormSubmit(args) {
        debugger;
        const project: IProject = {
            ...args.formData,
            tags: this.state.tags
        }
        this.props.onSubmit(project);
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
                "ui:field": (props) => {
                    return (
                        <TagsInput
                            tags={this.state.tags}
                            onChange={this.onTagsChange} />
                    );
                },
            },
        };

        return deepmerge(uiSchema, overrideUiSchema);
    }
}
