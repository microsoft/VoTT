import React from "react";
import { connect } from "react-redux";
import { Link, RouteComponentProps } from "react-router-dom";
import { bindActionCreators } from "redux";
import { strings } from "../../../../common/strings";
import { IApplicationState, IConnection, IProject } from "../../../../models/applicationState";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import { CloudFilePicker } from "../../common/cloudFilePicker/cloudFilePicker";
import CondensedList from "../../common/condensedList/condensedList";
import Confirm from "../../common/confirm/confirm";
import FilePicker from "../../common/filePicker/filePicker";
import "./homePage.scss";
import RecentProjectItem from "./recentProjectItem";
import { constants } from "../../../../common/constants";
import IAppErrorActions, * as appErrorActions from "../../../../redux/actions/appErrorActions";

export interface IHomepageProps extends RouteComponentProps, React.Props<HomePage> {
    recentProjects: IProject[];
    connections: IConnection[];
    actions: IProjectActions;
    appErrorActions: IAppErrorActions;
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
        appErrorActions: bindActionCreators(appErrorActions, dispatch),
    };
}

@connect(mapStateToProps, mapDispatchToProps)
export default class HomePage extends React.Component<IHomepageProps> {
    private filePicker: React.RefObject<FilePicker>;
    private deleteConfirm: React.RefObject<Confirm>;
    private cloudFilePicker: React.RefObject<CloudFilePicker>;

    constructor(props: IHomepageProps, context) {
        super(props, context);

        this.state = {
            cloudPickerOpen: false,
        };

        this.filePicker = React.createRef<FilePicker>();
        this.deleteConfirm = React.createRef<Confirm>();
        this.cloudFilePicker = React.createRef<CloudFilePicker>();

        this.loadSelectedProject = this.loadSelectedProject.bind(this);
        this.onProjectFileUpload = this.onProjectFileUpload.bind(this);
        this.deleteProject = this.deleteProject.bind(this);
        this.handleOpenCloudProjectClick = this.handleOpenCloudProjectClick.bind(this);

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
                                <h6>{strings.homePage.openLocalProject.title}</h6>
                            </a>
                            <FilePicker ref={this.filePicker}
                                onChange={this.onProjectFileUpload}
                                onError={this.onProjectFileUploadError} />
                        </li>
                        <li>
                            {/*Open Cloud Project*/}
                            <a href="#" onClick={this.handleOpenCloudProjectClick} className="p-5">
                                <i className="fas fa-cloud fa-9x"></i>
                                <h6>{strings.homePage.openCloudProject.title}</h6>
                            </a>
                            <CloudFilePicker
                                ref={this.cloudFilePicker}
                                connections={this.props.connections}
                                onSubmit={(content) => this.loadSelectedProject(JSON.parse(content))}
                                fileExtension={constants.projectFileExtension}
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
                    message={(project: IProject) => `${strings.homePage.deleteProject.confirmation} '${project.name}'?`}
                    confirmButtonColor="danger"
                    onConfirm={this.deleteProject} />
            </div>
        );
    }

    private handleOpenCloudProjectClick() {
        this.cloudFilePicker.current.open();
    }

    private onProjectFileUpload = async (e, project) => {
        let projectJson: IProject;
        try {
            projectJson = JSON.parse(project);
            await this.loadSelectedProject(projectJson);
        } catch (error) {
            this.props.appErrorActions.showError({
                title: strings.homePage.loadProjectError.title,
                message: strings.homePage.loadProjectError.message,
            });
        }
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
