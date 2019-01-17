import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import IApplicationActions, * as applicationActions from "../../../../redux/actions/applicationActions";
import { IApplicationState, IAppSettings } from "../../../../models/applicationState";
import Form, { FormValidation } from "react-jsonschema-form";
import "./appSettingsPage.scss";
import { strings, addLocValues } from "../../../../common/strings";
import { ArrayFieldTemplate } from "../../common/arrayField/arrayFieldTemplate";
import CustomFieldTemplate from "../../common/customField/customFieldTemplate";
import { ObjectFieldTemplate } from "../../common/objectField/objectFieldTemplate";
// tslint:disable-next-line:no-var-requires
const formSchema = addLocValues(require("./appSettingsPage.json"));
// tslint:disable-next-line:no-var-requires
const uiSchema = addLocValues(require("./appSettingsPage.ui.json"));

/**
 * Props for App Settings Page
 * @member appSettings - Current Application settings
 * @member connections - Application connections
 * @member actions - Application actions
 */
interface IAppSettingsProps {
    appSettings: IAppSettings;
    actions: IApplicationActions;
}

/**
 * State for App Settings Page
 * @member formSchema - JSON Form Schema for page
 * @member uiSchema - JSON Form UI Schema for page
 * @member appSettings - Application settings
 */
interface IAppSettingsState {
    formSchema: any;
    uiSchema: any;
    appSettings: IAppSettings;
    classNames: string[];
}

function mapStateToProps(state: IApplicationState) {
    return {
        appSettings: state.appSettings,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators(applicationActions, dispatch),
    };
}

/**
 * Page for viewing and editing application settings
 */
@connect(mapStateToProps, mapDispatchToProps)
export default class AppSettingsPage extends React.Component<IAppSettingsProps, IAppSettingsState> {
    constructor(props: IAppSettingsProps) {
        super(props);

        this.state = {
            formSchema: { ...formSchema },
            uiSchema: { ...uiSchema },
            appSettings: { ...this.props.appSettings },
            classNames: ["needs-validation"],
        };

        this.toggleDevTools = this.toggleDevTools.bind(this);
        this.reloadApp = this.reloadApp.bind(this);
        this.onFormSubmit = this.onFormSubmit.bind(this);
        this.onFormValidate = this.onFormValidate.bind(this);
    }

    public render() {
        return (
            <div className="text-light app-settings-page">
                <div className="app-settings-page-form p-3">
                    <h3>
                        <i className="fas fa-cog fa-1x"></i>
                        <span className="px-2">{strings.appSettings.title}</span>
                    </h3>
                    <Form
                        className={this.state.classNames.join(" ")}
                        showErrorList={false}
                        liveValidate={true}
                        noHtml5Validate={true}
                        ObjectFieldTemplate={ObjectFieldTemplate}
                        FieldTemplate={CustomFieldTemplate}
                        ArrayFieldTemplate={ArrayFieldTemplate}
                        validate={this.onFormValidate}
                        schema={this.state.formSchema}
                        uiSchema={this.state.uiSchema}
                        formData={this.state.appSettings}
                        onSubmit={this.onFormSubmit}>
                        <div>
                            <button type="submit" className="btn btn-success mr-1">Save Settings</button>
                            <button type="button" className="btn btn-secondary">Cancel</button>
                        </div>
                    </Form>
                </div>
                <div className="app-settings-page-sidebar p-3 bg-lighter-1">
                    <div className="my-3">
                        <p>{strings.appSettings.devTools.description}</p>
                        <button className="btn btn-primary btn-sm"
                            onClick={this.toggleDevTools}>{strings.appSettings.devTools.button}
                        </button>
                    </div>
                    <div className="my-3">
                        <p>{strings.appSettings.reload.description}</p>
                        <button className="btn btn-primary btn-sm"
                            onClick={this.reloadApp}>{strings.appSettings.reload.button}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    private onFormValidate(appSettings: IAppSettings, errors: FormValidation) {
        if (this.state.classNames.indexOf("was-validated") === -1) {
            this.setState({
                classNames: [...this.state.classNames, "was-validated"],
            });
        }

        return errors;
    }

    private onFormSubmit = (form) => {
        // TODO: Submit form
    }

    private toggleDevTools = () => {
        this.props.actions.toggleDevTools(!this.props.appSettings.devToolsEnabled);
    }

    private reloadApp = () => {
        this.props.actions.reloadApplication();
    }
}
