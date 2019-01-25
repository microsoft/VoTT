import React from "react";
import { IAppError, ErrorCode, AppError } from "../../../../models/applicationState";
import { strings } from "../../../../common/strings";
import Alert from "../alert/alert";

export interface IErrorHandlerProps extends React.Props<ErrorHandler> {
    error: IAppError;
    onError: (error: IAppError) => void;
    onClearError: () => void;
}

export class ErrorHandler extends React.Component<IErrorHandlerProps> {
    constructor(props, context) {
        super(props, context);

        this.onWindowError = this.onWindowError.bind(this);
        this.onUnhandedRejection = this.onUnhandedRejection.bind(this);
    }

    public componentDidMount() {
        window.addEventListener("error", this.onWindowError);
        window.addEventListener("unhandledrejection", this.onUnhandedRejection);
    }

    public componentWillMount() {
        window.removeEventListener("error", this.onWindowError);
        window.removeEventListener("unhandledrejection", this.onUnhandedRejection);
    }

    public render() {
        const showError = !!this.props.error;
        let displayError: IAppError = null;
        if (showError) {
            displayError = this.getDisplayError(this.props.error);
        }

        return (
            <Alert title={displayError ? displayError.title : ""}
                message={displayError ? displayError.message : ""}
                closeButtonColor="secondary"
                show={showError}
                onClose={this.props.onClearError} />
        );
    }

    private onWindowError(evt: ErrorEvent) {
        let appError: IAppError = null;
        if (evt.error instanceof AppError) {
            // Manually thrown AppError
            const error = evt.error as AppError;
            appError = {
                errorCode: error.errorCode,
                message: error.message,
                title: error.title,
            };
        } else if (evt.error instanceof Error) {
            // Other error like object
            const error = evt.error as Error;
            appError = {
                errorCode: ErrorCode.Unknown,
                message: error.message,
                title: error.name,
            };
        }
        this.props.onError(appError);
        evt.preventDefault();
    }

    private onUnhandedRejection(evt: PromiseRejectionEvent) {
        let appError: IAppError = null;

        // Promise rejection with reason
        if (evt.reason) {
            if (evt.reason instanceof String) {
                // Promise rejection with string base reason
                appError = {
                    errorCode: ErrorCode.Unknown,
                    message: evt.reason.toString(),
                };
            } else if (evt.reason instanceof AppError) {
                // Promise rejection with AppError
                const reason = evt.reason as IAppError;
                appError = {
                    errorCode: reason.errorCode,
                    message: reason.message,
                    title: reason.title,
                };
            } else if (evt.reason instanceof Error) {
                // Promise rejection with other error like object
                const reason = evt.reason as Error;
                appError = {
                    errorCode: ErrorCode.Unknown,
                    message: reason.message,
                };
            }
        }

        if (!appError) {
            appError = new AppError(ErrorCode.Unknown, "Unknown Error occurred");
        }

        this.props.onError(appError);
        evt.preventDefault();
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
