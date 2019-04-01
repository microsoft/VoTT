import { Env } from "./common/environment";
import { reactAI } from "react-appinsights";
import history from "./history";
import { ApplicationInsights, IExceptionTelemetry, SeverityLevel } from "@microsoft/applicationinsights-web";
import { version } from "../package.json";
import { isElectron } from "./common/hostProcess";
import { Action } from "redux";
import { IAppError } from "./models/applicationState";
import { config } from "dotenv";

// vott-app-insights
config();
const instrumentationKey = process.env.REACT_APP_INSTRUMENTATION_KEY;

let debug = false;
let maxBatchSize = 250;

if (Env.get() !== "production") {
    // for development/testing
    // myho-appinsights
    debug = true;
    maxBatchSize = 0;  // send telemetry as soon as it's collected
}

let appInsights;

/**
 * create an app insights connection for web version
 * do nothing for electron mode
 */
export function setUpAppInsights() {
    if (isElectron()) {
        return;
    }

    reactAI.setContext({
        AppVersion: version,
    });

    const config = {
        instrumentationKey,
        maxBatchSize,
        extensions: [reactAI],
        extensionConfig: {
            [reactAI.extensionId]: {
                debug,
                history,  // required for tracking router changes
            },
        },
    };

    appInsights = new ApplicationInsights({config});
    appInsights.loadAppInsights();
}

/**
 * send exception event to AppInsights
 * @param appError object containing the error type and error message
 */
export function trackError(appError: IAppError): void {
    if (isElectron()) {
        return;
    }

    const error = new Error(appError.errorCode);
    const exceptionTelemetry: IExceptionTelemetry = {
        error,
        properties: {
            message: appError.message,
        },
        severityLevel: SeverityLevel.Error,
    };

    appInsights.trackException(exceptionTelemetry);
}

/**
 * send custom event tracking redux action
 * @param action a redux action
 */
export function trackReduxAction(action: Action): void {
    if (isElectron()) {
        return;
    }

    appInsights.trackEvent({
        name: action.type,
    });
}
