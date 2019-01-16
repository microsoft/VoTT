import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { RouteComponentProps } from "react-router-dom";
import ProjectForm from "./projectForm";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import { IApplicationState, IProject, IConnection } from "../../../../models/applicationState";
import { strings } from "../../../../common/strings";

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
    actions: IProjectActions;
    connections: IConnection[];
}

function mapStateToProps(state: IApplicationState) {
    return {
        project: state.currentProject,
        connections: state.connections,
        recentProjects: state.recentProjects,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators(projectActions, dispatch),
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
            this.props.actions.loadProject(project);
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
                        onSubmit={this.onFormSubmit}
                        onCancel={this.onFormCancel} />
                </div>
            </div>
        );
    }

    private onFormSubmit = async (formData) => {
        const projectToUpdate: IProject = {
            ...formData,
        };

        await this.props.actions.saveProject(projectToUpdate);

        const isNew = !(!!projectToUpdate.id);
        if (isNew) {
            this.props.history.push(`/projects/${this.props.project.id}/edit`);
        } else {
            this.props.history.goBack();
        }
    }

    private onFormCancel() {
        this.props.history.goBack();
    }
}
