import React, { SyntheticEvent } from "react";
import axios, { AxiosRequestConfig } from "axios";
import { FieldProps } from "react-jsonschema-form";
import { interpolate } from "../../../../common/strings";

interface IKeyValuePair {
    key: string;
    value: string;
}

/**
 * Options for External Picker
 * @member method - HTTP method
 * @member url - URL for request
 * @member keySelector - Key attribute from HTTP response
 * @member valueSelector - Value attribute from HTTP response
 * @member authHeaderName - Authorization header name
 * @member authHeaderValue - Authorization header value
 */
export interface IExternalPickerUiOptions {
    method: string;
    url: string;
    keySelector: string;
    valueSelector: string;
    authHeaderName?: string;
    authHeaderValue?: string;
    filter?: IExternalPickerFilter;
}

export interface IExternalPickerFilter {
    left: string;
    right: string;
    operator: FilterOperator;
}

export enum FilterOperator {
    Equals = "eq",
    GreaterThan = "gt",
    LessThan = "lt",
}

/**
 * Properties for External Picker
 * @member options - External Picker UI options
 */
export interface IExternalPickerProps extends FieldProps {
    options: IExternalPickerUiOptions;
}

/**
 * State for External Picker
 * @member items - Items loaded from external source as options
 */
export interface IExternalPickerState {
    items: IKeyValuePair[];
}

/**
 * Dropdown that provides options from an external HTTP source
 */
export default class ExternalPicker extends React.Component<IExternalPickerProps, any> {
    public state: IExternalPickerState = {
        items: [],
    };

    public render() {
        return (
            <select id={this.props.id}
                className="form-control"
                value={this.props.value}
                onChange={this.onChange}>
                <option value="">Select {this.props.schema.title}</option>
                {this.state.items.map((item) => <option key={item.key} value={item.key}>{item.value}</option>)}
            </select>
        );
    }

    public async componentDidMount() {
        await this.bindExternalData();
    }

    public async componentDidUpdate(prevProps: FieldProps) {
        if (prevProps.formContext !== this.props.formContext) {
            await this.bindExternalData();
        }
    }

    private onChange = (e: SyntheticEvent) => {
        const target = e.target as HTMLSelectElement;
        this.props.onChange(target.value === "" ? undefined : target.value);
    }

    private bindExternalData = async (): Promise<void> => {
        const uiOptions = this.props.options;
        const customHeaders: any = {};
        const authHeaderValue = interpolate(uiOptions.authHeaderValue, {
            props: this.props,
        });

        if (!authHeaderValue || authHeaderValue === "undefined") {
            return;
        }

        customHeaders[uiOptions.authHeaderName] = authHeaderValue;

        const config: AxiosRequestConfig = {
            method: uiOptions.method,
            url: interpolate(uiOptions.url, { props: this.props }),
            headers: customHeaders,
        };

        try {
            const response = await axios.request(config);

            let rawItems: any[] = response.data;

            // Optionally filter results if a filter has been defined
            if (uiOptions.filter) {
                rawItems = rawItems.filter((item) => this.filterPredicate(item, uiOptions.filter));
            }

            const items: IKeyValuePair[] = rawItems.map((item) => {
                return {
                    key: interpolate(uiOptions.keySelector, { item }),
                    value: interpolate(uiOptions.valueSelector, { item }),
                };
            });

            this.setState({ items });
        } catch (e) {
            this.setState({ items: [] });
            this.props.onChange(undefined);
        }
    }

    /**
     * Determines if the specified item will return as part of the filter
     * @param item The item to evaluate
     * @param filter The filter expression to evaluate against
     */
    private filterPredicate(item: any, filter: IExternalPickerFilter): boolean {
        const left = interpolate(filter.left, { item, props: this.props });
        const right = interpolate(filter.right, { item, props: this.props });

        switch (filter.operator) {
            case FilterOperator.Equals:
                return left === right;
            case FilterOperator.GreaterThan:
                return left > right;
            case FilterOperator.LessThan:
                return left < right;
            default:
                throw new Error("Invalid filter operator");
        }
    }
}
