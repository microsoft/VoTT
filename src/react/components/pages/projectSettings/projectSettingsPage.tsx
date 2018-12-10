import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { RouteComponentProps } from "react-router-dom";
import ProjectForm from "./projectForm";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import { IApplicationState, IProject, IConnection } from "../../../../models/applicationState";
import IConnectionActions, * as connectionActions from "../../../../redux/actions/connectionActions";

interface IProjectSettingsPageProps extends RouteComponentProps, React.Props<ProjectSettingsPage> {
    project: IProject;
    projectActions: IProjectActions;
    connectionActions: IConnectionActions;
    connections: IConnection[];
}

interface IProjectSettingsPageState {
    project: IProject;
}

function mapStateToProps(state: IApplicationState) {
    return {
        project: state.currentProject,
        connections: state.connections,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        projectActions: bindActionCreators(projectActions, dispatch),
        connectionActions: bindActionCreators(connectionActions, dispatch),
    };
}

@connect(mapStateToProps, mapDispatchToProps)
export default class ProjectSettingsPage extends React.Component<IProjectSettingsPageProps, IProjectSettingsPageState> {
    constructor(props, context) {
        super(props, context);

        this.state = {
            project: this.props.project,
        };

        const projectId = this.props.match.params["projectId"];
        if (!this.props.project && projectId) {
            this.props.projectActions.loadProject(projectId);
        }

        if (!this.props.connections) {
            this.props.connectionActions.loadConnections();
        }

        this.onFormSubmit = this.onFormSubmit.bind(this);
    }

    public render() {
        return (
            <div className="m-3 text-light">
                <h3><i className="fas fa-sliders-h fa-1x"></i><span className="px-2">Project Settings</span></h3>
                <div className="m-3 text-light">
                    <ProjectForm
                        project={this.state.project}
                        connections={this.props.connections}
                        onSubmit={this.onFormSubmit} />
                </div>
            </div>
        );
    }

    private onFormSubmit = (form) => {
        form.formData.tags = JSON.parse(form.formData.tags);
        this.setState({
            project: {
                ...form.formData,
                sourceConnection: this.props.connections
                    .find((connection) => connection.id === form.formData.sourceConnectionId),
                targetConnection: this.props.connections
                    .find((connection) => connection.id === form.formData.targetConnectionId),
            },
        }, () => {
            this.props.projectActions.saveProject(this.state.project)
                .then((project) => {
                    this.props.history.push(`/projects/${project.id}/edit`);
                });
        });
    }
}
