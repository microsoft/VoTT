import React from "react";
import { ArrayFieldTemplateProps } from "react-jsonschema-form";

export function ArrayFieldTemplate(props: ArrayFieldTemplateProps) {
    return (
        <div>
            {props.canAdd &&
                <button type="button" className="btn btn-sm btn-primary" onClick={props.onAddClick}>
                    <i className="fas fa-plus-circle"></i> Add Item
                </button>
            }
            {props.items.map((item) => {
                return <div className="form-row" key={item.index}>
                    {item.children}
                    {item.hasRemove &&
                        <button type="button" className="btn btn-sm btn-danger" onClick={props.onAddClick}>
                            <i className="fas fa-minus-circle"></i>
                        </button>
                    }
                </div>;
            })}
        </div>
    );
}
