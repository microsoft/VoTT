import React from "react";
import _ from "lodash";
import Form, { Widget, FormValidation, IChangeEvent, ISubmitEvent } from "react-jsonschema-form";
import { addLocValues, strings } from "../../../../common/strings";
import { IExportFormat } from "../../../../models/applicationState";
import { ExportProviderFactory } from "../../../../providers/export/exportProviderFactory";
import ExportProviderPicker from "../../common/exportProviderPicker/exportProviderPicker";
import CustomFieldTemplate from "../../common/customField/customFieldTemplate";
import ExternalPicker from "../../common/externalPicker/externalPicker";
import { ProtectedInput } from "../../common/protectedInput/protectedInput";
import { ExportAssetState } from "../../../../providers/export/exportProvider";

// tslint:disable-next-line:no-var-requires
const formSchema = addLocValues(require("./exportForm.json"));
// tslint:disable-next-line:no-var-requires
const uiSchema = addLocValues(require("./exportForm.ui.json"));

/**
 * Properties for Export Form
 * @member settings - Current settings for Export
 * @member onSubmit - Function to call on form submission
 * @member onCancel - Function to call on form cancellation
 */
export interface IExportFormProps extends React.Props<ExportForm> {
    settings: IExportFormat;
    onSubmit: (exportFormat: IExportFormat) => void;
    onCancel?: () => void;
}

/**
 * State for Export Form
 * @member classNames - Class names for HTML form component
 * @member providerName - Name of export provider
 * @member formSchema - JSON Form Schema for export form
 * @member uiSchema - JSON Form UI Schema for export form
 * @member formData - Current state of form data as Export Format
 */
export interface IExportFormState {
    classNames: string[];
    providerName: string;
    formSchema: any;
    uiSchema: any;
    formData: IExportFormat;
}

/**
 * @name - Export Form
 * @description - Form to view/edit settings for exporting of project
 */
export default class ExportForm extends React.Component<IExportFormProps, IExportFormState> {
    private widgets = {
        externalPicker: (ExternalPicker as any) as Widget,
        exportProviderPicker: (ExportProviderPicker as any) as Widget,
        protectedInput: (ProtectedInput as any) as Widget,
    };

    constructor(props, context) {
        super(props, context);

        this.state = {
            classNames: ["needs-validation"],
            providerName: this.props.settings ? this.props.settings.providerType : null,
            formSchema: { ...formSchema },
            uiSchema: { ...uiSchema },
            formData: this.props.settings,
        };

        this.onFormSubmit = this.onFormSubmit.bind(this);
        this.onFormValidate = this.onFormValidate.bind(this);
        this.onFormChange = this.onFormChange.bind(this);
        this.onFormCancel = this.onFormCancel.bind(this);
    }

    public componentDidMount() {
        if (this.props.settings) {
            this.bindForm(this.props.settings);
        }
    }

    public componentDidUpdate(prevProps: IExportFormProps) {
        if (prevProps.settings !== this.props.settings) {
            this.bindForm(this.props.settings);
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
                widgets={this.widgets}
                formContext={this.state.formData}
                schema={this.state.formSchema}
                uiSchema={this.state.uiSchema}
                formData={this.state.formData}
                onChange={this.onFormChange}
                onSubmit={this.onFormSubmit}>
                <div>
                    <button className="btn btn-success mr-1" type="submit">{strings.export.saveSettings}</button>
                    <button className="btn btn-secondary btn-cancel"
                        type="button"
                        onClick={this.onFormCancel}>{strings.common.cancel}</button>
                </div>
            </Form>
        );
    }

    private onFormChange = (args: IChangeEvent<IExportFormat>) => {
        const providerType = args.formData.providerType;

        if (providerType !== this.state.providerName) {
            this.bindForm(args.formData, true);
        } else {
            this.setState({ formData: { ...args.formData } });
        }
    }

    private onFormValidate(exportFormat: IExportFormat, errors: FormValidation) {
        if (this.state.classNames.indexOf("was-validated") === -1) {
            this.setState({
                classNames: [...this.state.classNames, "was-validated"],
            });
        }

        return errors;
    }

    private onFormSubmit = (args: ISubmitEvent<IExportFormat>) => {
        this.props.onSubmit(args.formData);
    }

    private onFormCancel() {
        if (this.props.onCancel) {
            this.props.onCancel();
        }
    }

    private bindForm(exportFormat: IExportFormat, resetProviderOptions: boolean = false) {

        // If no provider type was specified on bind, pick the default provider
        const providerType = (exportFormat && exportFormat.providerType) ?
            exportFormat.providerType : ExportProviderFactory.defaultProvider.name;
        let newFormSchema: any = this.state.formSchema;
        let newUiSchema: any = this.state.uiSchema;

        if (providerType) {
            const providerSchema = addLocValues(require(`../../../../providers/export/${providerType}.json`));
            const providerUiSchema = require(`../../../../providers/export/${providerType}.ui.json`);

            newFormSchema = { ...formSchema };
            newFormSchema.properties["providerOptions"] = providerSchema;

            newUiSchema = { ...uiSchema };
            newUiSchema["providerOptions"] = providerUiSchema;
        }

        const formData = { ...exportFormat };
        if (resetProviderOptions) {
            formData.providerOptions = { assetState: ExportAssetState.All };
        }
        formData.providerType = providerType;

        this.setState({
            providerName: providerType,
            formSchema: newFormSchema,
            uiSchema: newUiSchema,
            formData,
        });
    }
}
