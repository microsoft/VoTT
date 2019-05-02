import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { RouteComponentProps } from "react-router-dom";
import ProjectForm from "./projectForm";
import { strings, interpolate } from "../../../../common/strings";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import { IApplicationState, IProject, IConnection, IAppSettings, ITag } from "../../../../models/applicationState";
import IApplicationActions, * as applicationActions from "../../../../redux/actions/applicationActions";
import { toast } from "react-toastify";
import "./projectSettingsPage.scss";
import ProjectMetrics from "./projectMetrics";
import { string } from "prop-types";

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

export interface IProjectSettingsPageState {
    project: IProject;
    renamedTags: Map<string, string>;
    deletedTags: Set<string>;
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

const projectFormTempKey = "projectForm";

/**
 * @name - Project Settings Page
 * @description - Page for adding/editing/removing projects
 */
@connect(mapStateToProps, mapDispatchToProps)
export default class ProjectSettingsPage extends React.Component<IProjectSettingsPageProps, IProjectSettingsPageState> {

    public state: IProjectSettingsPageState = {
        project: this.props.project,
        renamedTags: new Map<string, string>(),
        deletedTags: new Set<string>(),
    };

    public async componentDidMount() {
        const projectId = this.props.match.params["projectId"];
        // If we are creating a new project check to see if there is a partial
        // project already created in local storage
        if (this.props.match.url === "/projects/create") {
            const projectJson = localStorage.getItem(projectFormTempKey);
            if (projectJson) {
                this.setState({ project: JSON.parse(projectJson) });
            }
        } else if (!this.props.project && projectId) {
            const projectToLoad = this.props.recentProjects.find((project) => project.id === projectId);
            if (projectToLoad) {
                await this.props.applicationActions.ensureSecurityToken(projectToLoad);
                await this.props.projectActions.loadProject(projectToLoad);
            }
        }
    }

    public componentDidUpdate(prevProps: Readonly<IProjectSettingsPageProps>) {
        if (prevProps.project !== this.props.project) {
            this.setState({ project: this.props.project });
        }
    }

    public render() {
        return (
            <div className="project-settings-page">
                <div className="project-settings-page-settings m-3">
                    <h3>
                        <i className="fas fa-sliders-h" />
                        <span className="px-2">
                            {strings.projectSettings.title}
                        </span>
                    </h3>
                    <div className="m-3">
                        <ProjectForm
                            project={this.state.project}
                            connections={this.props.connections}
                            appSettings={this.props.appSettings}
                            onChange={this.onFormChange}
                            onSubmit={this.onFormSubmit}
                            onCancel={this.onFormCancel}
                            onTagDeleted={this.onTagDeleted}
                            onTagRenamed={this.onTagRenamed} />
                    </div>
                </div>
                {this.props.project &&
                    <div className="project-settings-page-metrics bg-lighter-1">
                        <ProjectMetrics project={this.props.project} />
                    </div>
                }
            </div>
        );
    }

    /**
     * When the project form is changed verifies if the project contains enough information
     * to persist into temp local storage to support better new project flow when
     * creating new connections inline
     */
    private onFormChange = (project: IProject) => {
        if (this.isPartialProject(project)) {
            localStorage.setItem(projectFormTempKey, JSON.stringify(project));
        }
    }

    private onFormSubmit = async (project: IProject) => {
        const isNew = !(!!project.id);

        if (!isNew) {
            await this.state.deletedTags.forEach(async (tag) => {
                // Handles the case of a tag being deleted and then re-added
                if (!project.tags.find((t) => t.name === tag)) {
                    await this.props.projectActions.deleteProjectTag(this.props.project, tag);
                }
            });

            await this.state.renamedTags.forEachAsync(async (tagName: string, newTagName: string) => {
                if (tagName !== newTagName) {
                    await this.props.projectActions.updateProjectTag(this.props.project, tagName, newTagName);
                }
            });
        }

        await this.props.applicationActions.ensureSecurityToken(project);
        await this.props.projectActions.saveProject(project);
        localStorage.removeItem(projectFormTempKey);

        toast.success(interpolate(strings.projectSettings.messages.saveSuccess, { project }));

        if (isNew) {
            this.props.history.push(`/projects/${this.props.project.id}/edit`);
        } else {
            this.props.history.goBack();
        }
    }

    private onFormCancel = () => {
        localStorage.removeItem(projectFormTempKey);
        this.props.history.goBack();
    }

    /**
     * Checks whether a project is partially populated
     */
    private isPartialProject = (project: IProject): boolean => {
        return project && !(!!project.id) &&
            (
                !!project.name
                || !!project.description
                || (project.sourceConnection && Object.keys(project.sourceConnection).length > 0)
                || (project.targetConnection && Object.keys(project.targetConnection).length > 0)
                || (project.exportFormat && Object.keys(project.exportFormat).length > 0)
                || (project.tags && project.tags.length > 0)
            );
    }

    private onTagRenamed = (tag: ITag, newTag: ITag) => {
        const { renamedTags } = this.state;
        renamedTags[tag.name] = newTag.name;
        this.setState({ renamedTags });
    }

    private onTagDeleted = (tag: ITag) => {
        const { deletedTags } = this.state;
        deletedTags.add(tag.name);
        this.setState({ deletedTags });
    }
}
