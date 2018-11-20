import React from 'react';
import './homePage.scss';
import CondensedList from '../../common/condensedList';
import RecentProjectItem from './recentProjectItem';

interface HomepageProps {}
interface HomepageState {
    recentProjects: any[]
}

export default class HomePage extends React.Component<HomepageProps, HomepageState> {
    constructor(props, context){
        super(props, context);

        this.state = {
            recentProjects: [
                { id: 1, name: 'Project 1'},
                { id: 1, name: 'Project 2'},
                { id: 1, name: 'Project 3'},
                { id: 1, name: 'Project 4'},
                { id: 1, name: 'Project 5'},
            ]
        };
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
                        items={this.state.recentProjects} />
                </div>
            </div>
        );
    }
}
