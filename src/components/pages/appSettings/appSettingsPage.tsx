import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import deepmerge from "deepmerge";
import IApplicationActions, * as applicationActions from "../../../actions/applicationActions";
import IConnectionActions, * as connectionActions from "../../../actions/connectionActions";
import ApplicationState, { IAppSettings, IConnection } from "../../../store/applicationState";
import Form from "react-jsonschema-form";
import formSchema from "./appSettings.json";
import uiSchema from "./appSettings.ui.json";
import "./appSettings.scss";
import ConnectionPicker from "../../common/connectionPicker";

interface IAppSettingsProps {
    appSettings: IAppSettings;
    connections: IConnection[];
    applicationActions: IApplicationActions;
    connectionActions: IConnectionActions;
}

interface IAppSettingsState {
    formSchema: any;
    uiSchema: any;
    appSettings: IAppSettings;
}

function mapStateToProps(state: ApplicationState) {
    return {
        connections: state.connections,
        appSettings: state.appSettings,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        applicationActions: bindActionCreators(applicationActions, dispatch),
        connectionActions: bindActionCreators(connectionActions, dispatch),
    };
}

@connect(mapStateToProps, mapDispatchToProps)
export default class AppSettingsPage extends React.Component<IAppSettingsProps, IAppSettingsState> {
    private widgets: any = {
        connectionPicker: ConnectionPicker,
    };

    constructor(props: IAppSettingsProps) {
        super(props);

        this.state = {
            formSchema: { ...formSchema },
            uiSchema: this.getUiSchema(),
            appSettings: { ...this.props.appSettings },
        };

        this.toggleDevTools = this.toggleDevTools.bind(this);
        this.reloadApp = this.reloadApp.bind(this);
        this.onFormSubmit = this.onFormSubmit.bind(this);
    }

    public async componentDidMount() {
        if (!this.props.connections) {
            await this.props.connectionActions.loadConnections();
        }
    }

    public componentDidUpdate(prevProps) {
        if (prevProps.connections !== this.props.connections) {
            this.setState({
                uiSchema: this.getUiSchema(),
            });
        }
    }

    public render() {
        return (
            <div className="m-3 text-light">
                <h3><i className="fas fa-cog fa-1x"></i><span className="px-2">Application Settings</span></h3>
                <hr />
                <div className="app-settings-page">
                    <div className="app-settings-page-form">
                        <Form
                            widgets={this.widgets}
                            schema={this.state.formSchema}
                            uiSchema={this.state.uiSchema}
                            formData={this.state.appSettings}
                            onSubmit={this.onFormSubmit} />
                    </div>
                    <div className="app-settings-page-sidebar px-2">
                        <div className="my-3">
                            <p>Open application developer tools to help diagnose issues</p>
                            <button className="btn btn-primary btn-sm"
                                onClick={this.toggleDevTools}>Toggle Developer Tools
                            </button>
                        </div>
                        <div className="my-3">
                            <p>Reload the app discarding all current changes</p>
                            <button className="btn btn-primary btn-sm"
                                onClick={this.reloadApp}>Refresh Application
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    private getUiSchema(): any {
        const overrideUiSchema = {
            connectionId: {
                "ui:options": {
                    connections: this.props.connections,
                },
            },
        };

        return deepmerge(uiSchema, overrideUiSchema);
    }

    private onFormSubmit = (form) => {
        // TODO: Submit form
    }

    private toggleDevTools = () => {
        this.props.applicationActions.toggleDevTools(!this.props.appSettings.devToolsEnabled);
    }

    private reloadApp = () => {
        this.props.applicationActions.reloadApplication();
    }
}
