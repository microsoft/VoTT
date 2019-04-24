import React from "react";
import Form, { ISubmitEvent, IChangeEvent, Widget } from "react-jsonschema-form";
import { IActiveLearningSettings, ModelPathType } from "../../../../models/applicationState";
import { strings, addLocValues } from "../../../../common/strings";
import CustomFieldTemplate from "../../common/customField/customFieldTemplate";
import LocalFolderPicker from "../../common/localFolderPicker/localFolderPicker";
import { CustomWidget } from "../../common/customField/customField";
import Checkbox from "rc-checkbox";

// tslint:disable-next-line:no-var-requires
const formSchema = addLocValues(require("./activeLearningForm.json"));
// tslint:disable-next-line:no-var-requires
const uiSchema = addLocValues(require("./activeLearningForm.ui.json"));

export interface IActiveLearningFormProps extends React.Props<ActiveLearningForm> {
    settings: IActiveLearningSettings;
    onSubmit: (settings: IActiveLearningSettings) => void;
    onChange?: (settings: IActiveLearningSettings) => void;
    onCancel?: () => void;
}

export interface IActiveLearningFormState {
    classNames: string[];
    formData: IActiveLearningSettings;
    uiSchema: any;
    formSchema: any;
}

export class ActiveLearningForm extends React.Component<IActiveLearningFormProps, IActiveLearningFormState> {
    public state: IActiveLearningFormState = {
        classNames: ["needs-validation"],
        uiSchema: { ...uiSchema },
        formSchema: { ...formSchema },
        formData: {
            ...this.props.settings,
        },
    };

    private widgets = {
        localFolderPicker: (LocalFolderPicker as any) as Widget,
        checkbox: CustomWidget(Checkbox, (props) => ({
            checked: props.value,
            onChange: (value) => props.onChange(value.target.checked),
            disabled: props.disabled,
        })),
    };

    public componentDidUpdate(prevProps: Readonly<IActiveLearningFormProps>) {
        if (this.props.settings !== prevProps.settings) {
            this.setState({ formData: this.props.settings });
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
                widgets={this.widgets}
                schema={this.state.formSchema}
                uiSchema={this.state.uiSchema}
                formData={this.state.formData}
                onChange={this.onFormChange}
                onSubmit={this.onFormSubmit}>
                <div>
                    <button className="btn btn-success mr-1" type="submit">{strings.projectSettings.save}</button>
                    <button className="btn btn-secondary btn-cancel"
                        type="button"
                        onClick={this.onFormCancel}>{strings.common.cancel}</button>
                </div>
            </Form>
        );
    }

    private onFormChange = (changeEvent: IChangeEvent<IActiveLearningSettings>): void => {
        let updatedSettings = changeEvent.formData;

        if (changeEvent.formData.modelPathType !== this.state.formData.modelPathType) {
            updatedSettings = {
                ...changeEvent.formData,
                modelPath: null,
                modelUrl: null,
            };
        }

        this.setState({
            formData: updatedSettings,
        }, () => {
            if (this.props.onChange) {
                this.props.onChange(updatedSettings);
            }
        });
    }

    private onFormSubmit = (args: ISubmitEvent<IActiveLearningSettings>): void => {
        const settings: IActiveLearningSettings = {
            ...args.formData,
        };

        this.setState({ formData: settings });
        this.props.onSubmit(settings);
    }

    private onFormCancel = (): void => {
        if (this.props.onCancel) {
            this.props.onCancel();
        }
    }
}
