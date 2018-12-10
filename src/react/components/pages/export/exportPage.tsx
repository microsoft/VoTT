import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { RouteComponentProps } from "react-router-dom";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import ExportForm from "./exportForm";
import { IProject, IApplicationState, IExportFormat } from "../../../../models/applicationState";

export interface IExportPageProps extends RouteComponentProps, React.Props<ExportPage> {
    project: IProject;
    actions: IProjectActions;
}

export interface IExportPageState {
    project: IProject;
}

function mapStateToProps(state: IApplicationState) {
    return {
        project: state.currentProject,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators(projectActions, dispatch),
    };
}

@connect(mapStateToProps, mapDispatchToProps)
export default class ExportPage extends React.Component<IExportPageProps, IExportPageState> {
    private emptyExportFormat: IExportFormat = {
        providerType: "",
        providerOptions: {},
    };

    constructor(props, context) {
        super(props, context);

        this.state = {
            project: this.props.project,
        };

        const projectId = this.props.match.params["projectId"];
        if (!this.props.project && projectId) {
            this.props.actions.loadProject(projectId);
        }

        this.onFormSubmit = this.onFormSubmit.bind(this);
    }

    public componentDidUpdate(prevProps) {
        if (prevProps.project !== this.props.project) {
            this.setState({
                project: this.props.project,
            });
        }
    }

    public render() {
        const exportFormat = this.state.project ? this.state.project.exportFormat : { ...this.emptyExportFormat };

        return (
            <div className="m-3 text-light">
                <h3><i className="fas fa-sliders-h fa-1x"></i><span className="px-2">Export Settings</span></h3>
                <div className="m-3 text-light">
                    <ExportForm
                        settings={exportFormat}
                        onSubmit={this.onFormSubmit} />
                </div>
            </div>
        );
    }

    private onFormSubmit = async (exportFormat: IExportFormat) => {
        const projectToUpdate: IProject = {
            ...this.state.project,
            exportFormat,
        };

        await this.props.actions.saveProject(projectToUpdate);
        await this.props.actions.exportProject(this.state.project);
        this.props.history.goBack();
    }
}
