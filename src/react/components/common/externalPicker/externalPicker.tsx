import React from "react";

export default class ExternalPicker extends React.Component<any> {
    constructor(props, context) {
        super(props, context);
    }

    public render() {
        return (
            <select id={this.props.id} value={this.props.value} onChange={this.props.onChange}>
                <option>{this.interpolate(JSON.stringify(this.props.formContext))}</option>
            </select>
        );
    }

    public componentDidUpdate(prevProps) {
        console.log(prevProps);
    }

    private interpolate(model: any) {
        return `Hello ${model}`;
    }
}
