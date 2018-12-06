import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import "./homePage.scss";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import { IApplicationState, IProject } from "../../../../models/applicationState";
import CondensedList from "../../common/condensedList";
import RecentProjectItem from "./recentProjectItem";
import FilePicker from "../../common/filePicker";
import { Link, RouteComponentProps } from "react-router-dom";

interface IHomepageProps extends RouteComponentProps, React.Props<HomePage> {
    recentProjects: IProject[];
    actions: IProjectActions;
}

function mapStateToProps(state: IApplicationState) {
    return {
        recentProjects: state.recentProjects,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators(projectActions, dispatch),
    };
}

@connect(mapStateToProps, mapDispatchToProps)
export default class HomePage extends React.Component<IHomepageProps> {
    private filePicker: React.RefObject<FilePicker>;

    constructor(props: IHomepageProps, context) {
        super(props, context);

        this.filePicker = React.createRef<FilePicker>();
        this.loadSelectedProject = this.loadSelectedProject.bind(this);
        this.onProjectFileUpload = this.onProjectFileUpload.bind(this);
        this.deleteProject = this.deleteProject.bind(this);

        this.props.actions.closeProject();
        this.props.actions.loadProjects();
    }

    public render() {
        return (
            <div className="app-homepage">
                <div className="app-homepage-main">
                    <ul>
                        <li>
                            <Link to={"/projects/create"} className="p-5">
                                <i className="fas fa-folder-plus fa-9x"></i>
                                <h6>New Project</h6>
                            </Link>
                        </li>
                        <li>
                            <a onClick={() => this.filePicker.current.upload()} className="p-5 file-upload">
                                <i className="fas fa-folder-open fa-9x"></i>
                                <h6>Open Project</h6>
                            </a>
                            <FilePicker ref={this.filePicker}
                                onChange={this.onProjectFileUpload}
                                onError={this.onProjectFileUploadError} />
                        </li>
                    </ul>
                </div>
                {(this.props.recentProjects && this.props.recentProjects.length > 0) &&
                    <div className="app-homepage-recent bg-lighter-1">
                        <CondensedList
                            title="Recent Projects"
                            Component={RecentProjectItem}
                            items={this.props.recentProjects}
                            onClick={this.loadSelectedProject}
                            onDelete={this.deleteProject} />
                    </div>
                }
            </div>
        );
    }

    private onProjectFileUpload = (e, projectJson) => {
        const project: IProject = JSON.parse(projectJson);
        this.loadSelectedProject(project);
    }

    private onProjectFileUploadError = (e, err) => {
        console.error(err);
    }

    private loadSelectedProject = (project: IProject) => {
        this.props.actions.loadProject(project).then(() => {
            this.props.history.push(`/projects/${project.id}/edit`);
        });
    }

    private deleteProject = (project: IProject) => {
        this.props.actions.deleteProject(project);
    }
}
