import React from "react";
import { connect } from "react-redux";
import { Link, RouteComponentProps } from "react-router-dom";
import { bindActionCreators } from "redux";
import { strings } from "../../../../common/strings";
import { IApplicationState, IConnection, IProject } from "../../../../models/applicationState";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import { CloudFilePicker } from "../../common/cloudFilePicker";
import CondensedList from "../../common/condensedList/condensedList";
import Confirm from "../../common/confirm/confirm";
import FilePicker from "../../common/filePicker/filePicker";
import "./homePage.scss";
import RecentProjectItem from "./recentProjectItem";

export interface IHomepageProps extends RouteComponentProps, React.Props<HomePage> {
    recentProjects: IProject[];
    connections: IConnection[];
    actions: IProjectActions;
}

interface IHomepageState {
    cloudPickerOpen: boolean;
}

function mapStateToProps(state: IApplicationState) {
    return {
        recentProjects: state.recentProjects,
        connections: state.connections,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators(projectActions, dispatch),
    };
}

@connect(mapStateToProps, mapDispatchToProps)
export default class HomePage extends React.Component<IHomepageProps, IHomepageState> {
    private filePicker: React.RefObject<FilePicker>;
    private deleteConfirm: React.RefObject<Confirm>;

    constructor(props: IHomepageProps, context) {
        super(props, context);

        this.state = {
            cloudPickerOpen: false,
        };

        this.filePicker = React.createRef<FilePicker>();
        this.deleteConfirm = React.createRef<Confirm>();
        this.loadSelectedProject = this.loadSelectedProject.bind(this);
        this.onProjectFileUpload = this.onProjectFileUpload.bind(this);
        this.deleteProject = this.deleteProject.bind(this);
        this.handleOpenCloudProjectClick = this.handleOpenCloudProjectClick.bind(this);
        this.handleCloseCloudProjectModal = this.handleCloseCloudProjectModal.bind(this);

        this.props.actions.closeProject();
    }

    public render() {
        return (
            <div className="app-homepage">
                <div className="app-homepage-main text-light">
                    <ul>
                        <li>
                            <Link to={"/projects/create"} className="p-5">
                                <i className="fas fa-folder-plus fa-9x"></i>
                                <h6>{strings.homePage.newProject}</h6>
                            </Link>
                        </li>
                        <li>
                            <a href="#" onClick={() => this.filePicker.current.upload()} className="p-5 file-upload">
                                <i className="fas fa-folder-open fa-9x"></i>
                                <h6>{strings.homePage.openProject}</h6>
                            </a>
                            <FilePicker ref={this.filePicker}
                                onChange={this.onProjectFileUpload}
                                onError={this.onProjectFileUploadError} />
                        </li>
                        <li>
                            {/*Open Cloud Project*/}
                            <a href="#" onClick={this.handleOpenCloudProjectClick} className="p-5 file-upload">
                                <i className="fas fa-cloud fa-9x"></i>
                                <h6>{strings.homePage.openCloudProject}</h6>
                            </a>
                            <CloudFilePicker
                                isOpen={this.state.cloudPickerOpen}
                                connections={this.props.connections}
                                onCancel={this.handleCloseCloudProjectModal}
                                onSubmit={this.loadSelectedProject}
                            />
                        </li>
                    </ul>
                </div>
                {(this.props.recentProjects && this.props.recentProjects.length > 0) &&
                    <div className="app-homepage-recent bg-lighter-1">
                        <CondensedList
                            title={strings.homePage.recentProjects}
                            Component={RecentProjectItem}
                            items={this.props.recentProjects}
                            onClick={this.loadSelectedProject}
                            onDelete={(project) => this.deleteConfirm.current.open(project)} />
                    </div>
                }
                <Confirm title="Delete Project"
                    ref={this.deleteConfirm}
                    message={(project: IProject) => `Are you sure you want to delete project '${project.name}'?`}
                    confirmButtonColor="danger"
                    onConfirm={this.deleteProject} />
            </div>
        );
    }

    private handleOpenCloudProjectClick() {
        this.setState({
            cloudPickerOpen: true,
        });
    }

    private handleCloseCloudProjectModal() {
        this.setState({
            cloudPickerOpen: false,
        });
    }

    private onProjectFileUpload = (e, projectJson) => {
        const project: IProject = JSON.parse(projectJson);
        this.loadSelectedProject(project);
    }

    private onProjectFileUploadError = (e, err) => {
        console.error(err);
    }

    private loadSelectedProject = async (project: IProject) => {
        await this.props.actions.loadProject(project);
        this.props.history.push(`/projects/${project.id}/edit`);
    }

    private deleteProject = async (project: IProject) => {
        await this.props.actions.deleteProject(project);
    }

}
