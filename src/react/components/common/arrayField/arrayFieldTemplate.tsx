import React from "react";
import { ArrayFieldTemplateProps } from "react-jsonschema-form";
import { strings } from "../../../../common/strings";

export function ArrayFieldTemplate(props: ArrayFieldTemplateProps) {
    return (
        <div>
            {props.canAdd &&
                <div className="array-field-toolbar my-3">
                    <button type="button" className="btn btn-info" onClick={props.onAddClick}>
                        <i className="fas fa-plus-circle"></i>
                        <span className="ml-1">Add {props.schema.title}</span>
                    </button>
                </div>
            }
            {props.items.map((item) => {
                return <div className="form-row" key={item.index}>
                    {item.children}
                    {item.hasRemove &&
                        <div className="array-item-toolbar">
                            <button
                                type="button"
                                className="btn btn-sm btn-danger"
                                onClick={item.onDropIndexClick(item.index)}>
                                <i className="fas fa-trash"></i>
                                <span className="ml-1">{strings.common.delete}</span>
                            </button>
                        </div>
                    }
                </div>;
            })}
        </div>
    );
}
