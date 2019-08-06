import React, { SyntheticEvent } from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import { bindActionCreators } from "redux";
import { strings, interpolate } from "../../../../common/strings";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import IApplicationActions, * as applicationActions from "../../../../redux/actions/applicationActions";
import "./login.scss";
import {
    IApplicationState, IConnection, IProject, IFileInfo,
    ErrorCode, AppError, IAppError, IAppSettings, IAsset, ILoginInfo
} from "../../../../models/applicationState";

import LoginForm from "./loginForm";

/**
 * Properties for Project Settings Page
 * @member project - Project being edited
 * @member recentProjects - Array of projects recently viewed/edited
 * @member actions - Project actions
 * @member connections - Array of connections available for projects
 */
export interface ILoginPageProps extends RouteComponentProps, React.Props<LoginPage> {
    login: ILoginInfo;
    actions: IProjectActions;
}

export interface ILoginPageState {
    login: ILoginInfo;
}


function mapStateToProps(state: IApplicationState) {
    return {
        login: state.loginInfo        
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators(projectActions, dispatch),
        applicationActions: bindActionCreators(applicationActions, dispatch),
    };
}
const projectFormTempKey = "loginForm";


/**
 * @name - Login Page
 * @description - page to allow user to put in information
 */
@connect(mapStateToProps, mapDispatchToProps)
export default class LoginPage extends React.Component<ILoginPageProps, ILoginPageState> {
    public state: ILoginPageState = {
        login: this.props.login 

    }

    public render() {
        return (
            <div className="login-page">
                <div className="login-page-settings m-3">
                    <h3>
                        <i className="fas fa-sliders-h" />
                        <span className="px-2">
                            {strings.login.title}
                        </span>
                    </h3>
                    <div className="m-3">
                        <LoginForm
                            login={this.state.login}
                            onSubmit={this.onFormSubmit}
                        />
                    </div>
                </div>
            </div>
        );
}


    /**
     * When the project form is changed verifies if the project contains enough information
     * to persist into temp local storage to support better new project flow when
     * creating new connections inline
     */


    private onFormSubmit = async (login: ILoginInfo) => {
        //const isNew = !(!!login.username);

        //await this.props.applicationActions.ensureSecurityToken(project);
        //await this.props.projectActions.saveProject(project);
        //localStorage.removeItem(projectFormTempKey);

        //toast.success(interpolate(strings.projectSettings.messages.saveSuccess, { project }));
        await this.props.actions.addLoginInfo(login);
        this.props.history.push(`/home`);

        //if (isNew) {
        //this.props.history.push(`/projects/home`);
        //} else {
         //   this.props.history.goBack();
        //}
    }

    
    /**
     * Checks whether a project is partially populated
     */
    private isPartialProject = (login: ILoginInfo): boolean => {
        return login && !(!!login.username) &&
            (
                !!login.username
                || (login.username && Object.keys(login.username).length > 0)
                || (login.password && Object.keys(login.password).length > 0)
                || (login.organization && Object.keys(login.organization).length > 0)
            );
    }
};