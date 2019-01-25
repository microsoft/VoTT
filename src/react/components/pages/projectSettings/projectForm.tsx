import React from "react";
import Form, { FormValidation, ISubmitEvent } from "react-jsonschema-form";
import { TagEditorModal  } from "vott-react";
import { addLocValues, strings } from "../../../../common/strings";
import { IConnection, IProject, ITag } from "../../../../models/applicationState";
import { StorageProviderFactory } from "../../../../providers/storage/storageProviderFactory";
import ConnectionPicker from "../../common/connectionPicker/connectionPicker";
import CustomField from "../../common/customField/customField";
import CustomFieldTemplate from "../../common/customField/customFieldTemplate";
import "vott-react/build/lib/components/tagsInput/tagsInput.css";

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
    formData: IProject;
    formSchema: any;
    uiSchema: any;
}

/**
 * @name - Project Form
 * @description - Form for editing or creating VoTT projects
 */
export default class ProjectForm extends React.Component<IProjectFormProps, IProjectFormState> {

    private tagsInput: React.RefObject<TagsInput>;
    private tagEditorModal: React.RefObject<TagEditorModal>;

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
        };
        debugger;
        this.tagsInput = React.createRef<TagsInput>();
        this.tagEditorModal = React.createRef<TagEditorModal>();

        this.onFormSubmit = this.onFormSubmit.bind(this);
        this.onFormCancel = this.onFormCancel.bind(this);
        this.onFormValidate = this.onFormValidate.bind(this);
        this.onTagClick = this.onTagClick.bind(this);
        this.onTagModalOk = this.onTagModalOk.bind(this);
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

    public render() {
        return (
            <Form
                className={this.state.classNames.join(" ")}
                showErrorList={false}
                liveValidate={true}
                noHtml5Validate={true}
                FieldTemplate={CustomFieldTemplate}
                validate={this.onFormValidate}
                fields={this.fields()}
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

                    tagNameText={strings.tags.modal.name}
                    tagColorText={strings.tags.modal.color}
                    saveText={strings.common.save}
                    cancelText={strings.common.cancel}
                />
            </Form>
        );
    }

    private fields() {
        return {
            sourceConnection: CustomField(ConnectionPicker, (props) => {
                return {
                    id: props.idSchema.$id,
                    value: props.formData,
                    connections: this.props.connections,
                    onChange: props.onChange,
                };
            }),
            targetConnection: CustomField(ConnectionPicker, (props) => {
                const targetConnections = this.props.connections.filter(
                    (connection) => StorageProviderFactory.isRegistered(connection.providerType));
                return {
                    id: props.idSchema.$id,
                    value: props.formData,
                    connections: targetConnections,
                    onChange: props.onChange,
                };
            }),
            tagsInput: CustomField(TagsInput, (props) => {
                const tagsInputProps: ITagsInputProps = {
                    tags: this.state.tags,
                    onChange: props.onChange,
                    placeHolder: strings.tags.placeholder,
                    onCtrlTagClick: this.onTagClick,
                    ref: this.tagsInput,
                };
                return tagsInputProps;
            }),
        };
    }

    private onTagClick(tag: ITag) {
        this.tagEditorModal.current.open(tag);
    }

    private onTagModalOk(oldTag: ITag, newTag: ITag) {
        this.tagsInput.current.updateTag(oldTag, newTag);
        this.tagEditorModal.current.close();
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
        debugger;
        const project: IProject = {
            ...args.formData,
            tags: this.state.tags,
        };
        this.props.onSubmit(project);
    }

    private onFormCancel() {
        if (this.props.onCancel) {
            this.props.onCancel();
        }
    }
}
