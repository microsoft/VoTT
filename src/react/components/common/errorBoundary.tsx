import React, { ErrorInfo } from "react";
import { connect } from "react-redux";
import IAppErrorActions from "../../../redux/actions/appErrorActions";
import { bindActionCreators } from "redux";
import * as appErrorActions from "../../../redux/actions/appErrorActions";
import {
    IAppError,
    IApplicationState,
    IAppErrorType,
} from "../../../models/applicationState";

export interface IErrorBoundaryProps {
    appError?: IAppError;
    actions?: IAppErrorActions;
}

function mapStateToProps(state: IApplicationState) {
    return {
        appError: state.appError,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators(appErrorActions, dispatch),
    };
}

@connect(mapStateToProps, mapDispatchToProps)
export default class ErrorBoundary extends React.Component<IErrorBoundaryProps> {
    constructor(props) {
        super(props);
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.props.actions.showError({
            title: error.name,
            message: error.message,
            errorType: IAppErrorType.Render,
        });
    }

    public render() {
        if (
            this.props.appError &&
            this.props.appError.errorType === IAppErrorType.Render
        ) {
            return null;
        }

        return this.props.children;
    }
}
