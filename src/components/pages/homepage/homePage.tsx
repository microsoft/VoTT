import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import './homePage.scss';
import IProjectActions, * as projectActions from '../../../actions/projectActions';
import ApplicationState, { IProject } from '../../../store/applicationState';
import CondensedList from '../../common/condensedList';
import RecentProjectItem from './recentProjectItem';
import FilePicker from '../../common/filePicker';
import { Link } from 'react-router-dom';

interface HomepageProps extends React.Props<HomePage> {
    recentProjects: IProject[],
    actions: IProjectActions
}

interface HomepageState {
    recentProjects: IProject[]
}

function mapStateToProps(state: ApplicationState) {
    return {
        recentProjects: state.recentProjects
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators(projectActions, dispatch)
    };
}

@connect(mapStateToProps, mapDispatchToProps)
export default class HomePage extends React.Component<HomepageProps, HomepageState> {
    private filePicker: React.RefObject<FilePicker>;

    constructor(props, context) {
        super(props, context);

        this.state = {
            recentProjects: this.props.recentProjects
        };

        this.filePicker = React.createRef<FilePicker>();
        this.onRecentProjectSelected = this.onRecentProjectSelected.bind(this);
        this.onProjectFileUpload = this.onProjectFileUpload.bind(this);
    }

    onProjectFileUpload = (e, projectJson) => {
        const project: IProject = JSON.parse(projectJson);
        this.props.actions.loadProject(project);
    }

    onProjectFileUploadError = (e, err) => {
        console.error(err);
    }

    onRecentProjectSelected = (project) => {
        this.props.actions.loadProject(project);
    }

    render() {
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
                            <a onClick={() => this.filePicker.current.upload()} className="p-5">
                                <i className="fas fa-folder-open fa-9x"></i>
                                <h6>Open Project</h6>
                            </a>
                            <FilePicker ref={this.filePicker}
                                onChange={this.onProjectFileUpload}
                                onError={this.onProjectFileUploadError} />
                        </li>
                    </ul>
                </div>
                <div className="app-homepage-recent bg-lighter-1">
                    <CondensedList
                        title="Recent Projects"
                        Component={RecentProjectItem}
                        items={this.state.recentProjects}
                        onClick={this.onRecentProjectSelected} />
                </div>
            </div>
        );
    }
}
