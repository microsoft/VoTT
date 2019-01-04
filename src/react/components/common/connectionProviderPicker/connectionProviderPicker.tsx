import React from "react";
import _ from "lodash";
import { WidgetProps } from "react-jsonschema-form";
import { StorageProviderFactory } from "../../../../providers/storage/storageProvider";
import { AssetProviderFactory } from "../../../../providers/storage/assetProvider";

export default function ConnectionProviderPicker(props: WidgetProps) {
    const storageProviders = _.values(StorageProviderFactory.providers);
    const assetProviders = _.values(AssetProviderFactory.providers);

    function onChange(e) {
        props.onChange(e.target.value);
    }

    const allProviders = _([])
        .concat(assetProviders)
        .concat(storageProviders)
        .uniqBy("name")
        .orderBy("displayName")
        .value();

    return (
        <select id={props.id}
            className="form-control"
            value={props.value}
            onChange={onChange}>
            <option value="">Select Provider</option>
            {
                allProviders.map((provider) =>
                    <option key={provider.name} value={provider.name}>
                        {provider.displayName}
                    </option>)
            }
        </select>
    );
}
