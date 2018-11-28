import React from 'react';
import IApplicationState, { IConnection } from '../../store/applicationState';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import IConnectionActions, * as connectionActions from '../../actions/connectionActions';
import { Link } from 'react-router-dom';

interface ConnectionPickerProps {
    id: string;
    value: any;
    connections: IConnection[];
    onChange: (value) => void;
    actions: IConnectionActions;
}

interface ConnectionPickerState {
    value: any
}

function mapStateToProps(state: IApplicationState) {
    return {
        connections: state.connections
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators(connectionActions, dispatch)
    };
}

@connect(mapStateToProps, mapDispatchToProps)
export default class ConnectionPicker extends React.Component<ConnectionPickerProps, ConnectionPickerState> {
    constructor(props, context) {
        super(props, context);

        this.state = {
            value: this.props.value
        };

        if (!this.props.connections) {
            this.props.actions.loadConnections();
        }

        this.onChange = this.onChange.bind(this);
    }

    onChange = (e) => {
        const selectedConnection = this.props.connections.find(connection => connection.id === e.currentTarget.value);

        if (selectedConnection) {
            this.setState({
                value: selectedConnection.id
            }, () => this.props.onChange(selectedConnection.id));
        }
    }

    render() {
        let { id, connections } = this.props;
        if (!connections) {
            connections = [];
        }

        const { value } = this.state;

        return (
            <div className="input-group">
                <select id={id} value={value} onChange={this.onChange} className="form-control">
                    <option value="">Select Connection</option>
                    {connections.map(connection => <option key={connection.id} value={connection.id}>{connection.name}</option>)}
                </select>
                <div className="input-group-append">
                    <Link to="/connections/create" className="btn btn-primary" type="button">Add Connection</Link>
                </div>
            </div>
        );
    }
}