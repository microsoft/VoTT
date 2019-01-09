import React from "react";
import _ from "lodash";
import { ExportProviderFactory } from "../../../../providers/export/exportProviderFactory";

export interface IExportProviderPickerProps {
    onChange: (value: string) => void;
    id: string;
    value: string;
}

export default function ExportProviderPicker(props: IExportProviderPickerProps) {
    const exportProviders = _.values(ExportProviderFactory.handlers);

    const allProviders = _([])
        .concat(exportProviders)
        .uniqBy("name")
        .orderBy("displayName")
        .value();

    function onChange(e) {
        props.onChange(e.target.value);
    }

    return (
        <select id={props.id}
            className="form-control"
            value={props.value}
            onChange={onChange}>
            {
                allProviders.map((provider) =>
                    <option key={provider.name} value={provider.name}>
                        {provider.displayName}
                    </option>)
            }
        </select>
    );
}
