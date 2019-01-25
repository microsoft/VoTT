import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { RouteComponentProps } from "react-router-dom";
import ProjectForm from "./projectForm";
import { strings, interpolate } from "../../../../common/strings";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import { IApplicationState, IProject, IConnection, IAppSettings } from "../../../../models/applicationState";
import IApplicationActions, * as applicationActions from "../../../../redux/actions/applicationActions";
import { generateKey } from "../../../../common/crypto";
import { toast } from "react-toastify";

/**
 * Properties for Project Settings Page
 * @member project - Project being edited
 * @member recentProjects - Array of projects recently viewed/edited
 * @member actions - Project actions
 * @member connections - Array of connections available for projects
 */
export interface IProjectSettingsPageProps extends RouteComponentProps, React.Props<ProjectSettingsPage> {
    project: IProject;
    recentProjects: IProject[];
    projectActions: IProjectActions;
    applicationActions: IApplicationActions;
    connections: IConnection[];
    appSettings: IAppSettings;
}

function mapStateToProps(state: IApplicationState) {
    return {
        project: state.currentProject,
        connections: state.connections,
        recentProjects: state.recentProjects,
        appSettings: state.appSettings,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        projectActions: bindActionCreators(projectActions, dispatch),
        applicationActions: bindActionCreators(applicationActions, dispatch),
    };
}

/**
 * @name - Project Settings Page
 * @description - Page for adding/editing/removing projects
 */
@connect(mapStateToProps, mapDispatchToProps)
export default class ProjectSettingsPage extends React.Component<IProjectSettingsPageProps> {
    constructor(props, context) {
        super(props, context);

        const projectId = this.props.match.params["projectId"];
        if (!this.props.project && projectId) {
            const project = this.props.recentProjects.find((project) => project.id === projectId);
            this.props.projectActions.loadProject(project);
        }

        this.onFormSubmit = this.onFormSubmit.bind(this);
        this.onFormCancel = this.onFormCancel.bind(this);
    }

    public render() {
        return (
            <div className="m-3 text-light">
                <h3>
                    <i className="fas fa-sliders-h fa-1x"></i>
                    <span className="px-2">
                        {strings.projectSettings.title}
                    </span>
                </h3>
                <div className="m-3 text-light">
                    <ProjectForm
                        project={this.props.project}
                        connections={this.props.connections}
                        appSettings={this.props.appSettings}
                        onSubmit={this.onFormSubmit}
                        onCancel={this.onFormCancel} />
                </div>
            </div>
        );
    }

    private onFormSubmit = async (project: IProject) => {
        const isNew = !(!!project.id);

        await this.ensureSecurityToken(project);
        await this.props.projectActions.saveProject(project);

        toast.success(interpolate(strings.projectSettings.messages.saveSuccess, { project }));

        if (isNew) {
            this.props.history.push(`/projects/${this.props.project.id}/edit`);
        } else {
            this.props.history.goBack();
        }
    }

    private onFormCancel() {
        this.props.history.goBack();
    }

    /**
     * Ensures that a valid security token is associated with the project, otherwise creates one
     * @param project The project to validate
     */
    private async ensureSecurityToken(project: IProject): Promise<IProject> {
        let securityToken = this.props.appSettings.securityTokens
            .find((st) => st.name === project.securityToken);

        if (securityToken) {
            return project;
        }

        securityToken = {
            name: `${project.name} Token`,
            key: generateKey(),
        };

        const updatedAppSettings: IAppSettings = {
            devToolsEnabled: this.props.appSettings.devToolsEnabled,
            securityTokens: [...this.props.appSettings.securityTokens, securityToken],
        };

        await this.props.applicationActions.saveAppSettings(updatedAppSettings);

        project.securityToken = securityToken.name;
        return project;
    }
}
