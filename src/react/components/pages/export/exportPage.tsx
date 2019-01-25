import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { RouteComponentProps } from "react-router-dom";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import ExportForm from "./exportForm";
import { IProject, IApplicationState, IExportFormat } from "../../../../models/applicationState";
import { strings } from "../../../../common/strings";
import { ExportAssetState } from "../../../../providers/export/exportProvider";
import { toast } from "react-toastify";

/**
 * Properties for Export Page
 * @member project - Project being edited
 * @member recentProjects - Array of projects recently viewed/edited
 * @member actions - Project actions
 */
export interface IExportPageProps extends RouteComponentProps, React.Props<ExportPage> {
    project: IProject;
    recentProjects: IProject[];
    actions: IProjectActions;
}

function mapStateToProps(state: IApplicationState) {
    return {
        project: state.currentProject,
        recentProjects: state.recentProjects,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators(projectActions, dispatch),
    };
}

/**
 * @name - Export Page
 * @description - Page for adding/editing/removing export configurations
 */
@connect(mapStateToProps, mapDispatchToProps)
export default class ExportPage extends React.Component<IExportPageProps> {
    private emptyExportFormat: IExportFormat = {
        providerType: "",
        providerOptions: {
            assetState: ExportAssetState.All,
        },
    };

    constructor(props, context) {
        super(props, context);

        const projectId = this.props.match.params["projectId"];
        if (!this.props.project && projectId) {
            const project = this.props.recentProjects.find((project) => project.id === projectId);
            this.props.actions.loadProject(project);
        }

        this.onFormSubmit = this.onFormSubmit.bind(this);
        this.onFormCancel = this.onFormCancel.bind(this);
    }

    public render() {
        const exportFormat = this.props.project && this.props.project.exportFormat
            ? this.props.project.exportFormat
            : { ...this.emptyExportFormat };

        return (
            <div className="m-3 text-light">
                <h3>
                    <i className="fas fa-sliders-h fa-1x"></i>
                    <span className="px-2">
                        {strings.export.settings}
                    </span>
                </h3>
                <div className="m-3 text-light">
                    <ExportForm
                        settings={exportFormat}
                        onSubmit={this.onFormSubmit}
                        onCancel={this.onFormCancel} />
                </div>
            </div>
        );
    }

    private onFormSubmit = async (exportFormat: IExportFormat) => {
        const projectToUpdate: IProject = {
            ...this.props.project,
            exportFormat,
        };

        await this.props.actions.saveProject(projectToUpdate);
        toast.success(strings.export.messages.saveSuccess);
        this.props.history.goBack();
    }

    private onFormCancel() {
        this.props.history.goBack();
    }
}
