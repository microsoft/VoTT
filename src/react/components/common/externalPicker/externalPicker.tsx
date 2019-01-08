import React from "react";
import axios, { AxiosRequestConfig } from "axios";
import { FieldProps } from "react-jsonschema-form";

interface IKeyValuePair {
    key: string;
    value: string;
}

export interface IExternalPickerState {
    items: IKeyValuePair[];
}

export default class ExternalPicker extends React.Component<FieldProps, any> {
    constructor(props, context) {
        super(props, context);

        this.state = {
            items: [],
        };
    }

    public render() {
        return (
            <select id={this.props.id}
                className="form-control"
                value={this.props.value}
                onChange={(e: any) => this.props.onChange(e.target.value)}>
                <option value="">Select {this.props.schema.title}</option>
                {this.state.items.map((item) => <option key={item.key} value={item.key}>{item.value}</option>)}
            </select>
        );
    }

    public async componentDidUpdate(prevProps: FieldProps) {
        if (prevProps.formContext !== this.props.formContext) {
            await this.bindExternalData();
        }
    }

    private async bindExternalData() {
        const uiOptions = this.props.options;
        const customHeaders: any = {};
        const authHeaderValue = this.interpolate(uiOptions.authHeaderValue, {
            props: this.props,
        });

        if (!authHeaderValue || authHeaderValue === "undefined") {
            return;
        }

        customHeaders[uiOptions.authHeaderName] = authHeaderValue;

        const config: AxiosRequestConfig = {
            method: uiOptions.method,
            url: uiOptions.url,
            headers: customHeaders,
        };

        const response = await axios.request(config);
        const items: IKeyValuePair[] = response.data.map((item) => {
            return {
                key: this.interpolate(uiOptions.keySelector, { item }),
                value: this.interpolate(uiOptions.valueSelector, { item }),
            };
        });

        this.setState({
            items,
        });
    }

    private interpolate(template: string, params: any) {
        const names = Object.keys(params);
        const vals = Object["values"](params);
        return new Function(...names, `return \`${template}\`;`)(...vals);
    }
}
