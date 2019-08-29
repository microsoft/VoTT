import React from "react";
import { IConnection } from "../../../../models/applicationState";
import { RouteComponentProps, withRouter } from "react-router-dom";

/**
 * Properties for Connection Picker
 * @member id - ID for HTML select element
 * @member value - Selected value of picker
 * @member connections - Array of connections for choosing
 * @member onChange - Function to call on change of selection
 */
export interface IConnectionPickerProps extends RouteComponentProps {
    id?: string;
    value: any;
    connections: IConnection[];
    onChange: (value) => void;
}

/**
 * State for Connection Picker
 * @member value - Selected value
 */
export interface IConnectionPickerState {
    value: any;
}

/**
 * @name - Connection Picker
 * @description - Enhanced dropdown for selecting a Connection
 */
export class ConnectionPicker extends React.Component<IConnectionPickerProps, IConnectionPickerState> {
    constructor(props, context) {
        super(props, context);
        this.state = {
            value: this.props.value,
        };

        this.onChange = this.onChange.bind(this);
    }

    public componentDidUpdate(prevProps) {
        if (prevProps.value !== this.props.value) {
            this.setState({
                value: this.props.value || null,
            });
        }
    }

    public render() {
        const { id, connections } = this.props;
        const selectedValue = this.state.value ? this.state.value.id : "";

        return (
            <div className="input-group">
                <select id={id} value={selectedValue} onChange={this.onChange} className="form-control">
                    <option>Select Connection</option>
                    {connections.map((connection) =>
                        <option
                            className="connection-option"
                            key={connection.id}
                            value={connection.id}>{this.getConnectionText(connection)}
                        </option>)
                    }
                </select>
                <div className="input-group-append">
                    <button className="btn btn-primary add-connection"
                        type="button"
                        onClick={this.createConnection}>Add Connection</button>
                </div>
            </div>
        );
    }

    private getConnectionText = (connection: IConnection): string => {
        const options = connection.providerOptions;

        if (options["folderPath"]) {
            return `${connection.name} (${options["folderPath"]})`;
        } else if (options["accountName"]) {
            return `${connection.name} (Azure:${options["accountName"]}\\${options["containerName"]})`;
        } else {
            return connection.name;
        }
    }

    private onChange = (e) => {
        const selectedConnection = this.props.connections
            .find((connection) => connection.id === e.target.value) || {};

        this.setState({
            value: selectedConnection,
        }, () => this.props.onChange(selectedConnection));
    }

    private createConnection = () => {
        this.props.history.push("/connections/create");
    }
}

export const ConnectionPickerWithRouter = withRouter<IConnectionPickerProps>(ConnectionPicker);
