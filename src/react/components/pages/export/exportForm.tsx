import React from "react";
import Form from "react-jsonschema-form";
import { IExportFormat } from "../../../../models/applicationState.js";
// tslint:disable-next-line:no-var-requires
const formSchema = require("./exportForm.json");
// tslint:disable-next-line:no-var-requires
const uiSchema = require("./exportForm.ui.json");

export interface IExportFormProps extends React.Props<ExportForm> {
    settings: IExportFormat;
    onSubmit: (exportFormat: IExportFormat) => void;
}

export interface IExportFormState {
    providerName: string;
    formSchema: any;
    uiSchema: any;
    formData: IExportFormat;
}

export default class ExportForm extends React.Component<IExportFormProps, IExportFormState> {
    constructor(props, context) {
        super(props, context);

        this.state = {
            providerName: this.props.settings ? this.props.settings.providerType : null,
            formSchema: { ...formSchema },
            uiSchema: { ...uiSchema },
            formData: this.props.settings,
        };

        if (this.props.settings) {
            this.bindForm(this.props.settings);
        }

        this.onFormChange = this.onFormChange.bind(this);
        this.onFormSubmit = this.onFormSubmit.bind(this);
    }

    public componentDidUpdate(prevProps) {
        if (prevProps.settings !== this.props.settings) {
            this.bindForm(this.props.settings);
        }
    }

    public render() {
        return (
            <Form
                schema={this.state.formSchema}
                uiSchema={this.state.uiSchema}
                formData={this.state.formData}
                onChange={this.onFormChange}
                onSubmit={this.onFormSubmit} />
        );
    }

    private onFormChange = (args) => {
        const providerType = args.formData.providerType;

        if (providerType !== this.state.providerName) {
            this.bindForm(args.formData, true);
        }
    }

    private onFormSubmit = (args) => {
        this.props.onSubmit(args.formData);
    }

    private bindForm(exportFormat: IExportFormat, resetProviderOptions: boolean = false) {
        const providerType = exportFormat ? exportFormat.providerType : null;
        let newFormSchema: any = this.state.formSchema;
        let newUiSchema: any = this.state.uiSchema;

        if (providerType) {
            const providerSchema = require(`../../../../providers/export/${providerType}.json`);
            const providerUiSchema = require(`../../../../providers/export/${providerType}.ui.json`);

            newFormSchema = { ...formSchema };
            newFormSchema.properties["providerOptions"] = providerSchema;

            newUiSchema = { ...uiSchema };
            newUiSchema["providerOptions"] = providerUiSchema;
        }

        const formData = { ...exportFormat };
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
