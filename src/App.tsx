import React, { Fragment } from "react";
import { connect } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Navbar from "./react/components/shell/navbar";
import Sidebar from "./react/components/shell/sidebar";
import MainContentRouter from "./react/components/shell/mainContentRouter";
import { IAppError, IApplicationState, IProject, AppError, ErrorCode } from "./models/applicationState";
import "./App.scss";
import "react-toastify/dist/ReactToastify.css";
import ErrorBoundary from "./react/components/common/errorBoundary";
import IAppErrorActions, * as appErrorActions from "./redux/actions/appErrorActions";
import { bindActionCreators } from "redux";
import Alert from "./react/components/common/alert/alert";
import { strings } from "./common/strings";

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

        this.onWindowError = this.onWindowError.bind(this);
        this.onUnhandedRejection = this.onUnhandedRejection.bind(this);
    }

    public componentDidMount() {
        window.onerror = this.onWindowError;
        window.addEventListener("unhandledrejection", this.onUnhandedRejection);
    }

    public render() {
        const showError = !!this.props.appError;
        let displayError: IAppError = null;
        if (showError) {
            displayError = this.getDisplayError(this.props.appError);
        }

        return (
            <Fragment>
                {showError &&
                    <Alert title={displayError.title}
                        message={displayError.message}
                        closeButtonColor="secondary"
                        show={showError}
                        onClose={this.props.actions.clearError} />
                }
                <ErrorBoundary>
                    <Router>
                        <div className="app-shell">
                            <Navbar />
                            <div className="app-main">
                                <Sidebar project={this.props.currentProject} />
                                <MainContentRouter />
                            </div>
                            <ToastContainer />
                        </div>
                    </Router >
                </ErrorBoundary >
            </Fragment>
        );
    }

    private onWindowError(message: string, url: string, lineNo: number, columnNo: number, error: any) {
        let appError: IAppError = null;
        if (error && error.errorCode && error.message) {
            // Manually thrown AppError
            appError = {
                errorCode: error.errorCode,
                message: error.message,
                title: error.title,
            };
        } else {
            // Other error like object
            appError = {
                errorCode: ErrorCode.Unknown,
                message: error.message,
                title: error.name,
            };
        }
        this.props.actions.showError(appError);
        return true;
    }

    private onUnhandedRejection(error: PromiseRejectionEvent) {
        let appError: IAppError = null;

        // Promise rejection with reason
        if (error.reason) {
            if (typeof (error.reason) === "string") {
                // Promise rejection with string base reason
                appError = {
                    errorCode: ErrorCode.Unknown,
                    message: error.reason,
                };
            } else if (error.reason.errorCode && error.reason.message) {
                // Promise rejection with AppError
                const reason = error.reason as IAppError;
                appError = {
                    errorCode: reason.errorCode,
                    message: reason.message,
                    title: reason.title,
                };
            } else if (error.reason.message) {
                // Promise rejection with other error like object
                const reason = error.reason as Error;
                appError = {
                    errorCode: ErrorCode.Unknown,
                    message: reason.message,
                };
            }
        }

        if (!appError) {
            appError = new AppError(ErrorCode.Unknown, "Unknown Error occurred");
        }

        this.props.actions.showError(appError);
        error.preventDefault();
    }

    /**
     * Gets a localized version of the error
     * @param appError The error thrown by the application
     */
    private getDisplayError(appError: IAppError): IAppError {
        const localizedError = strings.errors[appError.errorCode];
        if (!localizedError) {
            return appError;
        }

        return {
            errorCode: appError.errorCode,
            message: localizedError.message || strings.errors.Unknown.message,
            title: localizedError.title || strings.errors.Unknown.title,
        };
    }
}
