import React from "react";
import Form, { FormValidation, ISubmitEvent } from "react-jsonschema-form";
import { addLocValues, strings } from "../../../../common/strings";
import { IConnection, IProject, ITag } from "../../../../models/applicationState";
import ConnectionPicker from "../../common/connectionPicker/connectionPicker";
import CustomField from "../../common/customField/customField";
import CustomFieldTemplate from "../../common/customField/customFieldTemplate";
import { default as TagsInput, ITagsInputProps } from "../../common/tagsInput/tagsInput";
import { default as TagEditorModal } from "../../common/tagEditorModal/tagEditorModal";
import { StorageProviderFactory } from "../../../../providers/storage/storageProviderFactory";
// tslint:disable-next-line:no-var-requires
const formSchema = addLocValues(require("./projectForm.json"));
// tslint:disable-next-line:no-var-requires
const uiSchema = addLocValues(require("./projectForm.ui.json"));

/**
 * Required properties for Project Settings form
 * @member project - Current project to fill form
 * @member connections - Array of connections to use in project
 * @member onSubmit - Function to call on form submission
 * @member onCancel - Function to call on form cancellation
 */
export interface IProjectFormProps extends React.Props<ProjectForm> {
    project: IProject;
    connections: IConnection[];
    appSettings: IAppSettings;
    onSubmit: (project: IProject) => void;
    onCancel?: () => void;
}

/**
 * Project Form State
 * @member classNames - Class names for HTML form element
 * @member formData - data containing details of project
 * @member formSchema - json schema of form
 * @member uiSchema - json UI schema of form
 */
export interface IProjectFormState {
    classNames: string[];
    tags: ITag[];
    selectedTag: ITag;
    formData: IProject;
    formSchema: any;
    uiSchema: any;
}

/**
 * @name - Project Form
 * @description - Form for editing or creating VoTT projects
 */
export default class ProjectForm extends React.Component<IProjectFormProps, IProjectFormState> {
    
    private tagEditorModal: React.RefObject<TagEditorModal>;
    
    private fields = {
        securityToken: CustomField<ISecurityTokenPickerProps>(SecurityTokenPicker, (props) => ({
            id: props.idSchema.$id,
            schema: props.schema,
            value: props.formData,
            securityTokens: this.props.appSettings.securityTokens,
            onChange: props.onChange,
        })),
        sourceConnection: CustomField<IConnectionProviderPickerProps>(ConnectionPicker, (props) => ({
            id: props.idSchema.$id,
            value: props.formData,
            connections: this.props.connections,
            onChange: props.onChange,
        })),
        targetConnection: CustomField<IConnectionProviderPickerProps>(ConnectionPicker, (props) => {
            const targetConnections = this.props.connections.filter(
                (connection) => StorageProviderFactory.isRegistered(connection.providerType));
            return {
                id: props.idSchema.$id,
                value: props.formData,
                connections: targetConnections,
                onChange: props.onChange,
            };
        }),
<<<<<<< HEAD
        tagsInput: CustomField<ITagsInputProps>(TagsInput, (props) => ({
            tags: props.formData,
            onChange: props.onChange,
        })),
=======
        tagsInput: CustomField(TagsInput, (props) => {
            const tagsInputProps : ITagsInputProps = {
                tags: this.state.tags,
                onChange: this.onTagsChange,
                placeHolder: strings.tags.placeholder,
                onCtrlTagClick: this.onTagClick,
            }
            return tagsInputProps;
        }),
>>>>>>> most of code in place, just need to get it to compile
    };

    constructor(props, context) {
        super(props, context);
        this.state = {
            classNames: ["needs-validation"],
            uiSchema: { ...uiSchema },
            formSchema: { ...formSchema },
            formData: {
                ...this.props.project,
            },
            tags: (this.props.project) ? this.props.project.tags : [],
            selectedTag: null
        };
        this.tagEditorModal = React.createRef<TagEditorModal>();

        this.onFormSubmit = this.onFormSubmit.bind(this);
        this.onFormCancel = this.onFormCancel.bind(this);
        this.onFormValidate = this.onFormValidate.bind(this);
        this.onTagClick = this.onTagClick.bind(this);
        this.onTagsChange = this.onTagsChange.bind(this);
        this.onTagModalOk = this.onTagModalOk.bind(this);
        this.onTagModalCancel = this.onTagModalCancel.bind(this);
    }
    /**
     * Updates state if project from properties has changed
     * @param prevProps - previously set properties
     */
    public componentDidUpdate(prevProps: IProjectFormProps) {
        if (prevProps.project !== this.props.project) {
            this.setState({
                formData: { ...this.props.project },
            });
        }
    }

    private onTagsChange(tags: ITag[]) {
        this.setState({tags});
    }

    private onTagClick(tag: ITag) {
        this.setState({
            selectedTag: tag
        }, () => {
            this.tagEditorModal.current.open(tag);
        });
    }

    private onTagModalOk(tag: ITag) {
        /**
         * If this was a name change (names are not equal), don't allow
         * the new tag to be named with a name that currently exists
         * in other tags. Probably should include an error message.
         * For now, just doesn't allow the action to take place. Modal
         * won't close and user won't be able to set the name. This is
         * similar to how the component handles duplicate naming at the
         * creation level. If user enters name that already exists in
         * tags, the component just doesn't do anything.
         */
        if(tag.name !== this.state.selectedTag.name && this.state.tags.some((t) => t.name === tag.name)) {
            return;
        }
        this.setState((prevState: IProjectFormState) => {
            return {
                tags: prevState.tags.map((t) => {
                    if (t.name === prevState.selectedTag.name) {
                        return tag;
                    }
                    return t;
                })
            }
        });
        this.tagEditorModal.current.close();
    }

    private onTagModalCancel() {
        this.setState({
            selectedTag: null
        });
    }

    public render() {
        return (
            <Form
                className={this.state.classNames.join(" ")}
                showErrorList={false}
                liveValidate={true}
                noHtml5Validate={true}
                FieldTemplate={CustomFieldTemplate}
                validate={this.onFormValidate}
                fields={this.fields}
                schema={this.state.formSchema}
                uiSchema={this.state.uiSchema}
                formData={this.state.formData}
                onSubmit={this.onFormSubmit}>
                <div>
                    <button className="btn btn-success mr-1" type="submit">{strings.projectSettings.save}</button>
                    <button className="btn btn-secondary btn-cancel"
                        type="button"
                        onClick={this.onFormCancel}>{strings.common.cancel}</button>
                </div>
                <TagEditorModal
                    ref={this.tagEditorModal}
                    onOk={this.onTagModalOk}
                    onCancel={this.onTagModalCancel}

                    tagNameText={strings.tags.modal.name}
                    tagColorText={strings.tags.modal.color}
                    saveText={strings.common.save}
                    cancelText={strings.common.cancel}                    
                />
            </Form>
        );
    }

    private onFormValidate(project: IProject, errors: FormValidation) {
        if (Object.keys(project.sourceConnection).length === 0) {
            errors.sourceConnection.addError("is a required property");
        }

        if (Object.keys(project.targetConnection).length === 0) {
            errors.targetConnection.addError("is a required property");
        }

        if (this.state.classNames.indexOf("was-validated") === -1) {
            this.setState({
                classNames: [...this.state.classNames, "was-validated"],
            });
        }

        return errors;
    }

    private onFormSubmit(args: ISubmitEvent<IProject>) {
        const project: IProject = {
            ...args.formData,
            tags: this.state.tags
        };
        this.props.onSubmit(project);
    }

    private onFormCancel() {
        if (this.props.onCancel) {
            this.props.onCancel();
        }
    }
}
