import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import './homePage.scss';
import ApplicationState, { IProject } from '../../../store/applicationState';
import CondensedList from '../../common/condensedList';
import RecentProjectItem from './recentProjectItem';

interface HomepageProps { 
    recentProjects: IProject[]
}

interface HomepageState {
    recentProjects: IProject[]
}

function mapStateToProps(state: ApplicationState) {
    return {
        recentProjects: state.recentProjects
    };
}

// function mapDispatchToProps(dispatch) {
//     return {
//         actions: bindActionCreators(applicationActions, dispatch)
//     };
// }

@connect(mapStateToProps)
export default class HomePage extends React.Component<HomepageProps, HomepageState> {
    constructor(props, context) {
        super(props, context);

        this.state = {
            recentProjects: this.props.recentProjects
        };

        this.onRecentProjecdSelected = this.onRecentProjecdSelected.bind(this);
    }

    onRecentProjecdSelected = (args) => {
        console.log('You selected', args);
    }

    render() {
        return (
            <div className="app-homepage">
                <div className="app-homepage-main">
                    <ul>
                        <li>
                            <a href="#" className="p-5">
                                <i className="fas fa-folder-plus fa-9x"></i>
                                <h6>New Project</h6>
                            </a>
                        </li>
                        <li>
                            <a href="#" className="p-5">
                                <i className="fas fa-folder-open fa-9x"></i>
                                <h6>Open Project</h6>
                            </a>
                        </li>
                    </ul>
                </div>
                <div className="app-homepage-recent bg-lighter-1">
                    <CondensedList
                        title="Recent Projects"
                        Component={RecentProjectItem}
                        items={this.state.recentProjects}
                        onClick={this.onRecentProjecdSelected} />
                </div>
            </div>
        );
    }
}
