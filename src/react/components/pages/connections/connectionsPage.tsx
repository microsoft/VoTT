import React from "react";
import { Route } from "react-router-dom";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import ConnectionItem from "./connectionItem";
import CondensedList from "../../common/condensedList/condensedList";
import { IApplicationState, IConnection } from "../../../../models/applicationState";
import { RouteComponentProps } from "react-router-dom";
import IConnectionActions, * as connectionActions from "../../../../redux/actions/connectionActions";
import ConnectionForm from "./connectionForm";
import "./connectionsPage.scss";
import { strings } from "../../../../common/strings";
import Confirm from "../../common/confirm/confirm";
import { AssetProviderFactory } from "../../../../providers/storage/assetProvider";

export interface IConnectionPageProps extends RouteComponentProps, React.Props<ConnectionPage> {
    connections: IConnection[];
    actions: IConnectionActions;
}

export interface IConnectionPageState {
    connection: IConnection;
}

function mapStateToProps(state: IApplicationState) {
    return {
        connections: state.connections,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators(connectionActions, dispatch),
    };
}

@connect(mapStateToProps, mapDispatchToProps)
export default class ConnectionPage extends React.Component<IConnectionPageProps, IConnectionPageState> {
    private confirmDelete: React.RefObject<Confirm>;

    constructor(props, context) {
        super(props, context);

        this.state = {
            connection: null,
        };

        this.confirmDelete = React.createRef<Confirm>();
        this.onFormSubmit = this.onFormSubmit.bind(this);
        this.onFormCancel = this.onFormCancel.bind(this);
        this.onConnectionDelete = this.onConnectionDelete.bind(this);
    }

    public async componentDidMount() {
        const connectionId = this.props.match.params["connectionId"];
        if (connectionId) {
            this.loadConnection(connectionId);
        }
    }

    public componentDidUpdate = (prevProps) => {
        const prevConnectionId = prevProps.match.params["connectionId"];
        const newConnectionId = this.props.match.params["connectionId"];

        if (prevConnectionId !== newConnectionId) {
            this.loadConnection(newConnectionId);
        }
    }

    public render() {
        return (
            <div className="app-connections-page">
                <div className="app-connections-page-list bg-lighter-1">
                    <CondensedList
                        title={strings.connections.title}
                        newLinkTo={"/connections/create"}
                        onDelete={(connection) => this.confirmDelete.current.open(connection)}
                        Component={ConnectionItem}
                        items={this.props.connections} />
                </div>

                <Confirm ref={this.confirmDelete}
                    title="Delete Connection"
                    // tslint:disable-next-line:max-line-length
                    message={(connection: IConnection) => `Are you sure you want to delete the connection '${connection.name}'?`}
                    confirmButtonColor="danger"
                    onConfirm={(connection) => this.onConnectionDelete(connection)} />

                <Route exact path="/connections" render={(props) =>
                    <div className="app-connections-page-detail m-3 text-light">
                        <h6>{strings.connections.instructions}</h6>
                    </div>
                } />

                <Route exact path="/connections/:connectionId" render={(props) =>
                    <ConnectionForm
                        connection={this.state.connection}
                        onSubmit={this.onFormSubmit}
                        onCancel={this.onFormCancel} />
                } />
            </div>
        );
    }

    private async loadConnection(connectionId: string) {
        const connection = this.props.connections.find((connection) => connection.id === connectionId);
        if (connection) {
            this.setState({ connection });
        } else {
            this.setState({ connection: null });
        }
    }

    private onConnectionDelete = async (connection: IConnection) => {
        await this.props.actions.deleteConnection(connection);

        if (this.state.connection === connection) {
            this.props.history.push("/connections");
            this.setState({ connection: null });
        }
    }

    private onFormSubmit = async (connection: IConnection) => {
        const assetProvider = AssetProviderFactory.createFromConnection(connection);
        if (assetProvider.initialize) {
            await assetProvider.initialize();
        }
        await this.props.actions.saveConnection(connection);
        this.props.history.goBack();
    }

    private onFormCancel() {
        this.props.history.goBack();
    }
}
