import React from "react";
import { connect } from "react-redux";
import { Link, RouteComponentProps } from "react-router-dom";
import { bindActionCreators } from "redux";
import { strings } from "../../../../common/strings";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import IApplicationActions, * as applicationActions from "../../../../redux/actions/applicationActions";
import { CloudFilePicker } from "../../common/cloudFilePicker/cloudFilePicker";
import CondensedList from "../../common/condensedList/condensedList";
import Confirm from "../../common/confirm/confirm";
import FilePicker from "../../common/filePicker/filePicker";
import "./homePage.scss";
import RecentProjectItem from "./recentProjectItem";
import { constants } from "../../../../common/constants";
import {
    IApplicationState, IConnection, IProject, IFileInfo,
    ErrorCode, AppError, IAppError, IAppSettings,
} from "../../../../models/applicationState";
import { IV1Project, IV1Region } from "../../../../models/v1Models";
import IMessageBox from "../../common/messageBox/messageBox";
import ImportService from "../../../../services/importService";
import { AssetService } from "../../../../services/assetService";
import { IAssetMetadata } from "../../../../models/applicationState"

export interface IHomepageProps extends RouteComponentProps, React.Props<HomePage> {
    recentProjects: IProject[];
    connections: IConnection[];
    actions: IProjectActions;
    applicationActions: IApplicationActions;
    appSettings: IAppSettings;
    project: IProject;
}

function mapStateToProps(state: IApplicationState) {
    return {
        recentProjects: state.recentProjects,
        connections: state.connections,
        appSettings: state.appSettings,
        project: state.currentProject,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators(projectActions, dispatch),
        applicationActions: bindActionCreators(applicationActions, dispatch),
    };
}

@connect(mapStateToProps, mapDispatchToProps)
export default class HomePage extends React.Component<IHomepageProps> {
    private filePicker: React.RefObject<FilePicker>;
    private deleteConfirm: React.RefObject<Confirm>;
    private cloudFilePicker: React.RefObject<CloudFilePicker>;
    private importConfirm: React.RefObject<Confirm>;
    private settingsConfirm: React.RefObject<IMessageBox>;

    constructor(props: IHomepageProps, context) {
        super(props, context);

        this.state = {
            cloudPickerOpen: false,
        };

        this.filePicker = React.createRef<FilePicker>();
        this.deleteConfirm = React.createRef<Confirm>();
        this.cloudFilePicker = React.createRef<CloudFilePicker>();
        this.importConfirm = React.createRef<Confirm>();
        this.settingsConfirm = React.createRef<IMessageBox>();

        this.loadSelectedProject = this.loadSelectedProject.bind(this);
        this.onProjectFileUpload = this.onProjectFileUpload.bind(this);
        this.deleteProject = this.deleteProject.bind(this);
        this.handleOpenCloudProjectClick = this.handleOpenCloudProjectClick.bind(this);
        this.convertProject = this.convertProject.bind(this);

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
                    message={(project: IProject) => `${strings.homePage.deleteProject.confirmation} ${project.name}?`}
                    confirmButtonColor="danger"
                    onConfirm={this.deleteProject} />
                <Confirm title="Import Project"
                    ref={this.importConfirm}
                    message={(project: IFileInfo) => `${strings.homePage.importProject.confirmation}
                        ${project.file.name} ${strings.homePage.importProject.recommendation}`}
                    confirmButtonColor="danger"
                    onConfirm={this.convertProject} />
                <IMessageBox title="Confirm Settings"
                    ref={this.settingsConfirm}
                    message={"Please confirm your new v2 project settings."} />
            </div>
        );
    }

    private handleOpenCloudProjectClick() {
        this.cloudFilePicker.current.open();
    }

    private onProjectFileUpload = async (e, project) => {
        let projectJson: IProject;

        try {
            projectJson = JSON.parse(project.content);
        } catch (error) {
            throw new AppError(ErrorCode.ProjectInvalidJson, "Error parsing JSON");
        }

        // need a better check to tell if its v1
        if (projectJson.name == null) {
            try {
                await this.importConfirm.current.open(project);
            } catch (error) {
                console.log(error);
            }
        } else {
            await this.loadSelectedProject(projectJson);
        }
    }

    private onProjectFileUploadError = (e, error: any) => {
        if (error instanceof AppError) {
            throw error;
        }

        throw new AppError(ErrorCode.ProjectUploadError, "Error uploading project file");
    }

    private loadSelectedProject = async (project: IProject) => {
        await this.props.actions.loadProject(project);
        this.props.history.push(`/projects/${project.id}/edit`);
    }

    private deleteProject = async (project: IProject) => {
        try {
            await this.props.actions.deleteProject(project);
        } catch (error) {
            throw new AppError(ErrorCode.ProjectDeleteError, "Error deleting project file");
        }
    }

    private convertProject = async (projectInfo: IFileInfo) => {
        const importService = new ImportService(this.props.actions);
        let generatedAssetMetadata: IAssetMetadata[];
        let project;
        try {
            project = await importService.convertProject(projectInfo);
        } catch (e) {
            throw new AppError(ErrorCode.V1ImportError, "Error converting v1 project file");
        }
        
        this.props.applicationActions.ensureSecurityToken(project);
        const assetService = new AssetService(project);
        // await importService.addAssets(project, projectInfo);
        
        generatedAssetMetadata = await importService.generateAssets(projectInfo, assetService)
        await this.props.actions.saveProject(project);
        await this.props.actions.loadProject(project);
        let savedMetadata = generatedAssetMetadata.map((assetMetadata) => {
            return this.props.actions.saveAssetMetadata(this.props.project, assetMetadata);
        });
        try {
            await Promise.all(savedMetadata);
        } catch (e) {
            throw e;
        }
        await this.props.actions.saveProject(this.props.project);
        // await this.props.actions.loadAssets(this.props.project);
        await this.loadSelectedProject(this.props.project);
    }
}
