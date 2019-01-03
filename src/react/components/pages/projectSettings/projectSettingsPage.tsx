import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { RouteComponentProps } from "react-router-dom";
import ProjectForm from "./projectForm";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import { IApplicationState, IProject, IConnection } from "../../../../models/applicationState";
import { strings } from "../../../../common/strings";

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

        const projectName = formData["name"];
        const sourceConnection = formData.sourceConnection.name;
        const targetConnection = formData.targetConnection.name;
        const isNew = (this.props.recentProjects.find((project) => project.name === projectName) === undefined) &&
                      (this.props.recentProjects.find(
                          (project) => project.sourceConnection === sourceConnection) === undefined) &&
                      (this.props.recentProjects.find(
                          (project) => project.targetConnection === targetConnection) === undefined);

        try {
            if (isNew) {
                await this.props.actions.saveProject(projectToUpdate);
                this.props.history.push(`/projects/${this.props.project.id}/edit`);
            } else {
                throw new Error("You cannot create duplicate projects");
            }
        } catch (e) {
            console.log(e);
        }
    }

    private onFormCancel() {
        this.props.history.goBack();
    }
}
