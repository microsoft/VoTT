import React, { Fragment } from "react";
import { connect } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Navbar from "./react/components/shell/navbar";
import Sidebar from "./react/components/shell/sidebar";
import MainContentRouter from "./react/components/shell/mainContentRouter";
import { IAppError, IApplicationState, IProject } from "./models/applicationState";
import "./App.scss";
import "react-toastify/dist/ReactToastify.css";
import ErrorBoundary from "./react/components/common/errorBoundary";
import IAppErrorActions, * as appErrorActions from "./redux/actions/appErrorActions";
import { bindActionCreators } from "redux";
import Alert from "./react/components/common/alert/alert";

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
class App extends React.Component<IAppProps> {
    constructor(props, context) {
        super(props, context);

        this.state = {
            currentProject: this.props.currentProject,
        };
    }

    public render() {
        const showError = (this.props.appError !== null);
        const errorTitle = showError ? this.props.appError.title : "";
        const errorMessage = showError ? this.props.appError.message : "";

        return (
            <Fragment>
                <Alert title={errorTitle}
                    message={errorMessage}
                    closeButtonColor="info"
                    show={showError}
                    onClose={this.props.actions.clearError}
                />
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
}

export default App;
