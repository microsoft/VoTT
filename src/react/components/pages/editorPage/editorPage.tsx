import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _ from "lodash";
import { IApplicationState, IProject, IAsset } from "../../../../models/applicationState";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import { RouteComponentProps } from "react-router-dom";
import HtmlFileReader from "../../../../common/htmlFileReader";
import "./editorPage.scss";
import AssetPreview from "./assetPreview";
import EditorFooter from "./editorFooter";

interface IEditorPageProps extends RouteComponentProps, React.Props<IEditorPageProps> {
    project: IProject;
    projectActions: IProjectActions;
}

interface IEditorPageState {
    project: IProject;
    assets: IAsset[];
    selectedAsset?: IAsset;
}

function mapStateToProps(state: IApplicationState) {
    return {
        project: state.currentProject,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        projectActions: bindActionCreators(projectActions, dispatch),
    };
}

@connect(mapStateToProps, mapDispatchToProps)
export default class EditorPage extends React.Component<IEditorPageProps, IEditorPageState> {
    constructor(props, context) {
        super(props, context);

        this.state = {
            project: this.props.project,
            assets: [],
        };

        const projectId = this.props.match.params["projectId"];
        if (!this.props.project && projectId) {
            this.props.projectActions.loadProject(projectId);
        }

        this.selectAsset = this.selectAsset.bind(this);
        this.onFooterChange = this.onFooterChange.bind(this);
    }

    public async componentDidMount() {
        if (this.props.project) {
            await this.loadProjectAssets();
        }
    }

    public async componentDidUpdate() {
        if (this.props.project && this.state.assets.length === 0) {
            await this.loadProjectAssets();
        }
    }

    public render() {
        const { project } = this.props;
        const { assets, selectedAsset } = this.state;

        if (!project) {
            return (<div>Loading...</div>);
        }

        return (
            <div className="editor-page">
                <div className="editor-page-sidebar bg-lighter-1">
                    <div className="asset-list">
                        {
                            assets.map((asset) =>
                                <div className={selectedAsset && asset.id === selectedAsset.id
                                    ? "asset-item selected"
                                    : "asset-item"}
                                    onClick={() => this.selectAsset(asset)} key={asset.id}>
                                    <div className="asset-item-image">
                                        <AssetPreview asset={asset} />
                                    </div>
                                    <div className="asset-item-metadata">
                                        <span className="asset-filename" title={asset.name}>{asset.name}</span>
                                        {asset.size &&
                                            <span className="float-right">
                                                {asset.size.width} x {asset.size.height}
                                            </span>
                                        }
                                    </div>
                                </div>)
                        }
                    </div>
                </div>
                <div className="editor-page-content">
                    <div className="editor-page-content-header">
                        Header
                    </div>
                    <div className="editor-page-content-body">
                        {selectedAsset &&
                            <div className="canvas-container">
                                <AssetPreview asset={selectedAsset} />
                                {selectedAsset.size &&
                                    <div>
                                        Width: {selectedAsset.size.width}
                                        Height: {selectedAsset.size.height}
                                    </div>
                                }
                            </div>
                        }
                    </div>
                    <div>
                        <EditorFooter
                            tags={this.props.project.tags}
                            onTagsChanged={this.onFooterChange} />
                    </div>
                </div>
            </div>
        );
    }

    private onFooterChange(footerState) {
        this.setState({
            project: {
                ...this.state.project,
                tags: footerState.tags,
            },
        });
    }

    private async selectAsset(asset: IAsset) {
        const selectedAsset = { ...asset };

        try {
            const props = await HtmlFileReader.readAssetAttributes(selectedAsset);
            selectedAsset.size = { width: props.width, height: props.height };
            this.props.projectActions.saveAsset(selectedAsset);
        } catch (err) {
            console.error(err);
        }

        this.setState({
            selectedAsset: null,
        }, () => {
            this.setState({
                selectedAsset,
            }, async () => await this.props.projectActions.saveProject(this.props.project));
        });
    }

    private async loadProjectAssets() {
        if (this.state.assets.length > 0) {
            return;
        }

        const assets = await this.props.projectActions.loadAssets(this.props.project);

        this.setState({
            assets,
        }, async () => {
            if (assets.length > 0) {
                await this.selectAsset(assets[0]);
            }
        });
    }
}
