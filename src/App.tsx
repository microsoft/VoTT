import React, { Fragment } from "react";
import { connect } from "react-redux";
import { HashRouter as Router } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Navbar from "./react/components/shell/navbar";
import Sidebar from "./react/components/shell/sidebar";
import MainContentRouter from "./react/components/shell/mainContentRouter";
import { IAppError, IApplicationState, IProject, ErrorCode } from "./models/applicationState";
import "./App.scss";
import "react-toastify/dist/ReactToastify.css";
import IAppErrorActions, * as appErrorActions from "./redux/actions/appErrorActions";
import { bindActionCreators } from "redux";
import { ErrorHandler } from "./react/components/common/errorHandler/errorHandler";
import { KeyboardManager } from "./react/components/common/keyboardManager/keyboardManager";
import { TitleBar } from "./react/components/shell/titleBar";

interface IAppProps {
    currentProject?: IProject;
    appError?: IAppError;
    actions?: IAppErrorActions;
}

function mapStateToProps(state: IApplicationState) {
    return {
        currentProject: state.currentProject,
        appError: state.appError,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators(appErrorActions, dispatch),
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
        return (
            <Fragment>
                <ErrorHandler
                    error={this.props.appError}
                    onError={this.props.actions.showError}
                    onClearError={this.props.actions.clearError} />
                {/* Don't render app contents during a render error */}
                {(!this.props.appError || this.props.appError.errorCode !== ErrorCode.GenericRenderError) &&
                    <KeyboardManager>
                        <Router>
                            <div className="app-shell">
                                <TitleBar title={this.props.currentProject ? this.props.currentProject.name : ""}>
                                </TitleBar>
                                {/* <Navbar /> */}
                                <div className="app-main">
                                    <Sidebar project={this.props.currentProject} />
                                    <MainContentRouter />
                                </div>
                                <ToastContainer />
                            </div>
                        </Router >
                    </KeyboardManager>
                }
            </Fragment>
        );
    }
}
