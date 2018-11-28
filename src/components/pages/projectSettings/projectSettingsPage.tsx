import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import IProjectActions, * as projectActions from '../../../actions/projectActions';
import ApplicationState, { IProject, IConnection } from '../../../store/applicationState';
import Form from 'react-jsonschema-form'
import formSchema from './projectSettingsPage.json';
import uiSchema from './projectSettingsPage.ui.json';
import { RouteComponentProps } from 'react-router-dom';
import ConnectionPicker from '../../common/connectionPicker';

interface ProjectSettingsPageProps extends RouteComponentProps, React.Props<ProjectSettingsPage> {
    currentProject: IProject;
    actions: IProjectActions;
    connections: IConnection[];
}

interface ProjectSettingsPageState {
    project: IProject;
    formSchema: any;
    uiSchema: any;
}

function mapStateToProps(state: ApplicationState) {
    return {
        currentProject: state.currentProject,
        connections: state.connections
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators(projectActions, dispatch)
    };
}

@connect(mapStateToProps, mapDispatchToProps)
export default class ProjectSettingsPage extends React.Component<ProjectSettingsPageProps, ProjectSettingsPageState> {
    private widgets = {
        connectionPicker: ConnectionPicker
    }

    constructor(props, context) {
        super(props, context);

        this.state = {
            formSchema: { ...formSchema },
            uiSchema: { ...uiSchema },
            project: this.props.currentProject,
        };

        this.onFormSubmit = this.onFormSubmit.bind(this);
    }

    onFormSubmit = (form) => {
        this.setState({
            project: {
                ...form.formData,
                sourceConection: this.props.connections.find(connection => connection.id === form.formData.sourceConnectionId),
                targetConection: this.props.connections.find(connection => connection.id === form.formData.targetConnectionId)
            }
        }, () => {
            this.props.actions.saveProject(this.state.project)
                .then(project => {
                    this.props.history.push(`/projects/${project.id}/edit`);
                });
        });
    }

    render() {
        return (
            <div className="m-3 text-light">
                <h3><i className="fas fa-sliders-h fa-1x"></i><span className="px-2">Project Settings</span></h3>
                <hr />

                <Form
                    widgets={this.widgets}
                    schema={this.state.formSchema}
                    uiSchema={this.state.uiSchema}
                    formData={this.state.project}
                    onSubmit={this.onFormSubmit} />
            </div>
        );
    }
}
