import { Env } from "./common/environment";
import { reactAI } from "react-appinsights";
import history from "./history";
import { ApplicationInsights, SeverityLevel } from "@microsoft/applicationinsights-web";
import { version } from "../package.json";
import { isElectron } from "./common/hostProcess";
import { Action } from "redux";
import { ErrorCode } from "./models/applicationState";
import { Error } from "tslint/lib/error";

// vott-app-insights
let INSTRUMENTATION_KEY = "0b9e5117-c78d-40c9-9338-921092cde49a";
let debug = false;
let maxBatchSize = 250;

if (Env.get() !== "production") {
    // for development/testing
    // myho-appinsights
    INSTRUMENTATION_KEY = "40a80c0c-b913-45b7-afc9-c7eb3ed62900";
    debug = true;
    maxBatchSize = 0;  // send telemetry as soon as it's collected
}

let appInsights;

export function setUpAppInsights() {
    if (isElectron()) {
        return;
    }

    reactAI.setContext({
        AppVersion: version,
    });

    const config = {
        instrumentationKey: INSTRUMENTATION_KEY,
        maxBatchSize,
        extensions: [reactAI],
        extensionConfig: {
            [reactAI.extensionId]: {
                debug,
                history,  // required for tracking router changes
            },
        },
    };

    appInsights = new ApplicationInsights({config}).loadAppInsights();
}

export function trackError(errorCode: ErrorCode, errorMessage: string): void {
    if (isElectron()) {
        return;
    }

    const error = new Error(errorCode.toString());
    appInsights.trackException({
        error,
        properties: {
            message: errorMessage,
        },
        severityLevel: SeverityLevel.Error,
    });
}

export function trackReduxAction(action: Action): void {
    if (isElectron()) {
        return;
    }

    appInsights.trackEvent({
        name: action.type,
    });
}
