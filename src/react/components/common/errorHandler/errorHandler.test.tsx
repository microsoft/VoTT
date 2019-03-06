import React from "react";
import { IErrorHandlerProps, ErrorHandler } from "./errorHandler";
import { mount, ReactWrapper } from "enzyme";
import Alert from "../alert/alert";
import { ErrorCode, IAppError, AppError } from "../../../../models/applicationState";
import { strings } from "../../../../common/strings";
jest.mock("../../../../common/environment");
import { Env } from "../../../../common/environment";

describe("Error Handler Component", () => {
    const onErrorHandler = jest.fn();
    const onClearErrorHandler = jest.fn();
    const defaultProps: IErrorHandlerProps = {
        error: null,
        onError: onErrorHandler,
        onClearError: onClearErrorHandler,
    };

    function createComponent(props: IErrorHandlerProps = null): ReactWrapper<IErrorHandlerProps> {
        props = props || defaultProps;
        return mount(<ErrorHandler {...props} />);
    }

    it("does not render an alert when error property is not set", () => {
        const wrapper = createComponent();
        expect(wrapper.find(Alert).exists()).toBe(false);
    });

    it("renders an alert when error property is set", () => {
        const props: IErrorHandlerProps = {
            ...defaultProps,
            error: {
                errorCode: ErrorCode.Unknown,
                message: "error message",
                title: "error title",
            },
        };

        const wrapper = createComponent(props);
        const alert = wrapper.find(Alert);
        expect(alert.exists()).toBe(true);
        expect(alert.prop("title")).toEqual("error title");
        expect(alert.prop("message")).toEqual("error message");
    });

    it("renders an alert with localized error messages", () => {
        const props: IErrorHandlerProps = {
            ...defaultProps,
            error: {
                errorCode: ErrorCode.ProjectInvalidJson,
                message: "JSON is messed up",
                title: "JSON error",
            },
        };

        const wrapper = createComponent(props);
        const alert = wrapper.find(Alert);
        expect(alert.exists()).toBe(true);
        expect(alert.prop("title")).toEqual(strings.errors.projectInvalidJson.title);
        expect(alert.prop("message")).toEqual(strings.errors.projectInvalidJson.message);
    });

    it("calls onError when window Error is thrown", () => {
        const thrownError = new Error("New generic error message");
        const errorEvent = new ErrorEvent("error", {
            message: thrownError.message,
            lineno: 100,
            colno: 1,
            error: thrownError,
        });

        const expectedError: IAppError = {
            errorCode: ErrorCode.Unknown,
            title: thrownError.name,
            message: thrownError.message,
        };

        createComponent();
        document.dispatchEvent(errorEvent);

        expect(onErrorHandler).toBeCalledWith(expectedError);
    });

    it("calls onError when window AppError is thrown", () => {
        const thrownError = new AppError(ErrorCode.ProjectInvalidJson, "message", "title");
        const errorEvent = new ErrorEvent("error", {
            message: thrownError.message,
            lineno: 100,
            colno: 1,
            error: thrownError,
        });

        const expectedError: IAppError = {
            errorCode: ErrorCode.ProjectInvalidJson,
            title: thrownError.title,
            message: thrownError.message,
        };

        createComponent();
        document.dispatchEvent(errorEvent);

        expect(onErrorHandler).toBeCalledWith(expectedError);
    });

    it("calls onError when unhandled rejection throws Error", () => {
        const thrownError = new Error("New generic error message");
        const errorEvent = new CustomEvent("unhandledrejection", {
            detail: thrownError,
        });

        const expectedError: IAppError = {
            errorCode: ErrorCode.Unknown,
            title: thrownError.name,
            message: thrownError.message,
        };

        createComponent();
        document.dispatchEvent(errorEvent);

        expect(onErrorHandler).toBeCalledWith(expectedError);
    });

    it("calls onError when unhandled rejection throws AppError", () => {
        const thrownError = new AppError(ErrorCode.ProjectInvalidJson, "message", "title");
        const errorEvent = new CustomEvent("unhandledrejection", {
            detail: thrownError,
        });

        const expectedError: IAppError = {
            errorCode: ErrorCode.ProjectInvalidJson,
            title: thrownError.title,
            message: thrownError.message,
        };

        createComponent();
        document.dispatchEvent(errorEvent);

        expect(onErrorHandler).toBeCalledWith(expectedError);
    });

    it("calls onError when unhandled rejection resolves with string reason", () => {
        const thrownError = "message as string";
        const errorEvent = new CustomEvent("unhandledrejection", {
            detail: thrownError,
        });

        const expectedError: IAppError = {
            errorCode: ErrorCode.Unknown,
            message: thrownError,
        };

        createComponent();
        document.dispatchEvent(errorEvent);

        expect(onErrorHandler).toBeCalledWith(expectedError);
    });

    it("formulates pre-formatted JSON error with unknown error code in dev mode", () => {
        const thrownError = {
            code: "ENOENT",
            errno: -4058,
            path: "C:/images",
        };
        const errorEvent = new CustomEvent("unhandledrejection", {
            detail: thrownError,
        });

        Env.get = jest.fn(() => "development");

        const expectedError: IAppError = {
            title: strings.errors.unknown.title,
            errorCode: ErrorCode.Unknown,
            message: <pre>{JSON.stringify(thrownError, null, 2)}</pre>,
        };

        createComponent();
        document.dispatchEvent(errorEvent);

        expect(onErrorHandler).toBeCalledWith(expectedError);
    });

    it("Displays generic unknown error message in production mode", () => {
        const thrownError = {
            code: "ENOENT",
            errno: -4058,
            path: "C:/images",
        };
        const errorEvent = new CustomEvent("unhandledrejection", {
            detail: thrownError,
        });

        Env.get = jest.fn(() => "production");

        const expectedError: IAppError = {
            title: strings.errors.unknown.title,
            errorCode: ErrorCode.Unknown,
            message: strings.errors.unknown.message,
        };

        createComponent();
        document.dispatchEvent(errorEvent);

        expect(onErrorHandler).toBeCalledWith(expectedError);
    });
});
