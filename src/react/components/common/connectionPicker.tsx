import React from "react";
import { IConnection } from "../../../models/applicationState";
import { Link } from "react-router-dom";

interface IConnectionPickerProps {
    id?: string;
    value: any;
    connections: IConnection[];
    onChange: (value) => void;
}

interface IConnectionPickerState {
    value: any;
}

export default class ConnectionPicker extends React.Component<IConnectionPickerProps, IConnectionPickerState> {
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
                        <option key={connection.id} value={connection.id}>{connection.name}</option>)
                    }
                </select>
                <div className="input-group-append">
                    <Link to="/connections/create" className="btn btn-primary" type="button">Add Connection</Link>
                </div>
            </div>
        );
    }

    private onChange = (e) => {
        const selectedConnection = this.props.connections
            .find((connection) => connection.id === e.target.value) || {};

        this.setState({
            value: selectedConnection,
        }, () => this.props.onChange(selectedConnection));
    }
}
