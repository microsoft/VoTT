import React from 'react';
import { IConnection } from '../../store/applicationState';

interface ConnectionPickerProps {
    id: string;
    value: any;
    connections: IConnection[];
    onChange: (value) => void;
}

interface ConnectionPickerState {
    value: any
}

export default class ConnectionPicker extends React.Component<ConnectionPickerProps, ConnectionPickerState> {
    constructor(props, context) {
        super(props, context);

        this.state = {
            value: this.props.value
        };
    }


    render() {
        const { id, connections } = this.props;
        const { value } = this.state;

        return (
            <div className="input-group">
                <select id={id} value={value} className="form-control">
                    
                </select>
                <div className="input-group-append">
                    <button className="btn btn-primary" type="button">Add Connection</button>
                </div>
            </div>
        );
    }
}