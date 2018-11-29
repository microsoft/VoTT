import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { RouteComponentProps } from "react-router-dom";
import ProjectForm from "./projectForm";
import IProjectActions, * as projectActions from "../../../actions/projectActions";
import ApplicationState, { IProject, IConnection } from "../../../store/applicationState";
import IConnectionActions, * as connectionActions from "../../../actions/connectionActions";

interface IProjectSettingsPageProps extends RouteComponentProps, React.Props<ProjectSettingsPage> {
    currentProject: IProject;
    projectActions: IProjectActions;
    connectionActions: IConnectionActions;
    connections: IConnection[];
}

interface IProjectSettingsPageState {
    project: IProject;
}

function mapStateToProps(state: ApplicationState) {
    return {
        currentProject: state.currentProject,
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
            project: this.props.currentProject,
        };

        this.onFormSubmit = this.onFormSubmit.bind(this);
    }

    public async componentDidMount() {
        const projectId = this.props.match.params["projectId"];
        if (!this.state.project && projectId) {
            const currentProject = await this.props.projectActions.loadProject(projectId);

            this.setState({
                project: currentProject,
            });
        }

        if (!this.props.connections) {
            await this.props.connectionActions.loadConnections();
        }
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
