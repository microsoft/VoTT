import React from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router";
import { bindActionCreators } from "redux";
import { IActiveLearningSettings, IProject, IApplicationState } from "../../../../models/applicationState";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import { strings } from "../../../../common/strings";
import { ActiveLearningForm } from "./activeLearningForm";
import { toast } from "react-toastify";

export interface IActiveLearningPageProps extends RouteComponentProps, React.Props<ActiveLearningPage> {
    project: IProject;
    recentProjects: IProject[];
    actions: IProjectActions;
}

export interface IActiveLearningPageState {
    settings: IActiveLearningSettings;
}

function mapStateToProps(state: IApplicationState) {
    return {
        project: state.currentProject,
        recentProjects: state.recentProjects,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators(projectActions, dispatch),
    };
}

@connect(mapStateToProps, mapDispatchToProps)
export default class ActiveLearningPage extends React.Component<IActiveLearningPageProps, IActiveLearningPageState> {
    public state: IActiveLearningPageState = {
        settings: this.props.project ? this.props.project.activeLearningSettings : null,
    };

    public async componentDidMount() {
        const projectId = this.props.match.params["projectId"];
        // If we are creating a new project check to see if there is a partial
        // project already created in local storage
        if (!this.props.project && projectId) {
            const projectToLoad = this.props.recentProjects.find((project) => project.id === projectId);
            if (projectToLoad) {
                await this.props.actions.loadProject(projectToLoad);
            }
        }
    }

    public componentDidUpdate(prevProps: Readonly<IActiveLearningPageProps>) {
        if (prevProps.project !== this.props.project) {
            this.setState({ settings: this.props.project.activeLearningSettings });
        }
    }

    public render() {
        return (
            <div className="project-settings-page">
                <div className="project-settings-page-settings m-3">
                    <h3>
                        <i className="fas fa-graduation-cap" />
                        <span className="px-2">
                            {strings.activeLearning.title}
                        </span>
                    </h3>
                    <div className="m-3">
                        <ActiveLearningForm
                            settings={this.state.settings}
                            onSubmit={this.onFormSubmit}
                            onCancel={this.onFormCancel} />
                    </div>
                </div>
            </div>
        );
    }

    private onFormSubmit = async (settings: IActiveLearningSettings): Promise<void> => {
        const updatedProject: IProject = {
            ...this.props.project,
            activeLearningSettings: settings,
        };

        await this.props.actions.saveProject(updatedProject);
        toast.success(strings.activeLearning.messages.saveSuccess);
        this.props.history.goBack();
    }

    private onFormCancel = (): void => {
        this.props.history.goBack();
    }
}
