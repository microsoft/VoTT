import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import IApplicationActions, * as applicationActions from '../../../actions/applicationActions';
import ApplicationState, { IAppSettings } from '../../../store/applicationState';

interface IAppSettingsProps {
    appSettings: IAppSettings,
    actions: IApplicationActions
}

function mapStateToProps(state: ApplicationState) {
    return {
        appSettings: state.appSettings
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators(applicationActions, dispatch)
    };
}

@connect(mapStateToProps, mapDispatchToProps)
export default class AppSettingsPage extends React.Component<IAppSettingsProps, any> {
    constructor(props: IAppSettingsProps) {
        super(props);

        this.toggleDevTools = this.toggleDevTools.bind(this);
        this.reloadApp = this.reloadApp.bind(this);
    }

    toggleDevTools = () => {
        this.props.actions.toggleDevTools(!this.props.appSettings.devToolsEnabled);
    }

    reloadApp = () => {
        this.props.actions.reloadApplication();
    }

    render() {
        return (
            <div className="m-3 text-light">
                <h3><i className="fas fa-cog fa-1x"></i><span className="px-2">Application Settings</span></h3>
                <hr />
                <div className="my-3">
                    <p>Open application developer tools to help diagnose issues</p>
                    <button className="btn btn-primary btn-sm" onClick={this.toggleDevTools}>Toggle Developer Tools</button>
                </div>
                <div className="my-3">
                    <p>Reload the app discarding all current changes</p>
                    <button className="btn btn-primary btn-sm" onClick={this.reloadApp}>Refresh Application</button>
                </div>
            </div>
        );
    }
}