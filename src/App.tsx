import React, { Fragment } from "react";
import { connect } from "react-redux";
import { Router, Redirect } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Sidebar from "./react/components/shell/sidebar";
import MainContentRouter from "./react/components/shell/mainContentRouter";
import { IAppError, IApplicationState, IProject, ErrorCode, IAuth } from "./models/applicationState";
import "./App.scss";
import "react-toastify/dist/ReactToastify.css";
import IAppErrorActions, * as appErrorActions from "./redux/actions/appErrorActions";
import { bindActionCreators } from "redux";
import { ErrorHandler } from "./react/components/common/errorHandler/errorHandler";
import { KeyboardManager } from "./react/components/common/keyboardManager/keyboardManager";
import { TitleBar } from "./react/components/shell/titleBar";
import { StatusBar } from "./react/components/shell/statusBar";
import { StatusBarMetrics } from "./react/components/shell/statusBarMetrics";
import { HelpMenu } from "./react/components/shell/helpMenu";
import history from "./history";
import ApiService from "./services/apiService";
import IAuthActions, * as authActions from "./redux/actions/authActions";

interface IAppProps {
    currentProject?: IProject;
    appError?: IAppError;
    actions?: IAppErrorActions;
    auth?: IAuth;
    authActions?: IAuthActions;
}

function mapStateToProps(state: IApplicationState) {
    return {
        currentProject: state.currentProject,
        appError: state.appError,
        auth: state.auth,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators(appErrorActions, dispatch),
        authActions: bindActionCreators(authActions, dispatch),
    };
}

/**
 * @name - App
 * @description - Root level component for VoTT Application
 */
@connect(mapStateToProps, mapDispatchToProps)
export default class App extends React.Component<IAppProps> {
    constructor(props, context) {
        super(props, context);

        this.state = {
            currentProject: this.props.currentProject,
        };
    }

    public componentDidCatch(error: Error) {
        this.props.actions.showError({
            errorCode: ErrorCode.GenericRenderError,
            title: error.name,
            message: error.message,
        });
    }

    public render() {
        const platform = global && global.process ? global.process.platform : "web";
        if (!this.props.auth.rememberUser) {
            window.addEventListener("beforeunload", async (e) => {
                event.preventDefault();
                localStorage.removeItem("token");
                await this.props.authActions.signOut();
            });
        }
        return (
            <Fragment>
                <ErrorHandler
                    error={this.props.appError}
                    onError={this.props.actions.showError}
                    onClearError={this.props.actions.clearError} />
                {/* Don't render app contents during a render error */}
                {(!this.props.appError || this.props.appError.errorCode !== ErrorCode.GenericRenderError) &&
                    <KeyboardManager>
                        <Router history={history}>
                            <div className={`app-shell platform-${platform}`}>
                                <TitleBar icon="fas fa-tags"
                                    title={this.props.currentProject ? this.props.currentProject.name : ""}
                                    fullName={ApiService.getToken() ? this.props.auth.fullName : ""}>
                                    <div className="app-help-menu-icon"><HelpMenu/></div>
                                </TitleBar>
                                <div className="app-main">
                                    {
                                        this.props.auth.accessToken !== null &&
                                        <Sidebar project={this.props.currentProject} />
                                    }
                                    <MainContentRouter />
                                </div>
                                <StatusBar>
                                    <StatusBarMetrics project={this.props.currentProject} />
                                </StatusBar>
                                <ToastContainer className="vott-toast-container" />
                            </div>
                        </Router >
                    </KeyboardManager>
                }
            </Fragment>
        );
    }
}
