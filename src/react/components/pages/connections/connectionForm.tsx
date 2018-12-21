import React from "react";
import Form, { Widget, IChangeEvent, FormValidation } from "react-jsonschema-form";
import { IConnection } from "../../../../models/applicationState";
import LocalFolderPicker from "../../common/localFolderPicker";
import CustomFieldTemplate from "../../common/customFieldTemplate";
// tslint:disable-next-line:no-var-requires
const formSchema = require("./connectionForm.json");
// tslint:disable-next-line:no-var-requires
const uiSchema = require("./connectionForm.ui.json");

export interface IConnectionFormProps extends React.Props<ConnectionForm> {
    connection: IConnection;
    onSubmit: (connection: IConnection) => void;
    onCancel?: () => void;
}

export interface IConnectionFormState {
    providerName: string;
    formSchema: any;
    uiSchema: any;
    formData: IConnection;
    classNames: string[];
}

export default class ConnectionForm extends React.Component<IConnectionFormProps, IConnectionFormState> {
    private widgets = {
        localFolderPicker: (LocalFolderPicker as any) as Widget,
    };

    constructor(props, context) {
        super(props, context);

        this.state = {
            classNames: ["needs-validation"],
            formSchema: { ...formSchema },
            uiSchema: { ...uiSchema },
            providerName: this.props.connection ? this.props.connection.providerType : null,
            formData: this.props.connection,
        };

        if (this.props.connection) {
            this.bindForm(this.props.connection);
        }

        this.onFormCancel = this.onFormCancel.bind(this);
        this.onFormValidate = this.onFormValidate.bind(this);
        this.onFormChange = this.onFormChange.bind(this);
    }

    public componentDidUpdate(prevProps: IConnectionFormProps) {
        if (prevProps.connection !== this.props.connection) {
            this.bindForm(this.props.connection);
        }
    }

    public render() {
        return (
            <div className="app-connections-page-detail m-3 text-light">
                <h3><i className="fas fa-plug fa-1x"></i><span className="px-2">Connection Settings</span></h3>
                <div className="m-3 text-light">
                    <Form
                        className={this.state.classNames.join(" ")}
                        showErrorList={false}
                        liveValidate={true}
                        noHtml5Validate={true}
                        FieldTemplate={CustomFieldTemplate}
                        validate={this.onFormValidate}
                        widgets={this.widgets}
                        schema={this.state.formSchema}
                        uiSchema={this.state.uiSchema}
                        formData={this.state.formData}
                        onChange={this.onFormChange}
                        onSubmit={(form) => this.props.onSubmit(form.formData)}>
                        <div>
                            <button className="btn btn-success mr-1" type="submit">Save Connection</button>
                            <button className="btn btn-secondary btn-cancel"
                                type="button"
                                onClick={this.onFormCancel}>Cancel</button>
                        </div>
                    </Form>
                </div>
            </div>
        );
    }

    private onFormValidate(connection: IConnection, errors: FormValidation) {
        if (this.state.classNames.indexOf("was-validated") === -1) {
            this.setState({
                classNames: [...this.state.classNames, "was-validated"],
            });
        }

        return errors;
    }

    private onFormChange = (args: IChangeEvent<IConnection>) => {
        const providerType = args.formData.providerType;

        if (providerType !== this.state.providerName) {
            this.bindForm(args.formData, true);
        } else {
            this.setState({
                formData: args.formData,
            });
        }
    }

    private onFormCancel() {
        if (this.props.onCancel) {
            this.props.onCancel();
        }
    }

    private bindForm(connection: IConnection, resetProviderOptions: boolean = false) {
        const providerType = connection ? connection.providerType : null;
        let newFormSchema: any = this.state.formSchema;
        let newUiSchema: any = this.state.uiSchema;

        if (providerType) {
            const providerSchema = require(`../../../../providers/storage/${providerType}.json`);
            const providerUiSchema = require(`../../../../providers/storage/${providerType}.ui.json`);

            newFormSchema = { ...formSchema };
            newFormSchema.properties["providerOptions"] = providerSchema;

            newUiSchema = { ...uiSchema };
            newUiSchema["providerOptions"] = providerUiSchema;
        }

        const formData = { ...connection };
        if (resetProviderOptions) {
            formData.providerOptions = {};
        }

        this.setState({
            providerName: providerType,
            formSchema: newFormSchema,
            uiSchema: newUiSchema,
            formData,
        });
    }
}
