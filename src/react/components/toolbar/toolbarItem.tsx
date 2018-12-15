import React from "react";
import { IProject } from "../../../models/applicationState";
import IProjectActions from "../../../redux/actions/projectActions";

export interface IToolbarItemMetadata {
    name: string;
    icon: string;
    tooltip: string;
    group: string;
    type: ToolbarItemType;
}

export enum ToolbarItemType {
    Action = 0,
    State = 1,
}

export interface IToolbarItemProps extends IToolbarItemMetadata, React.Props<ToolbarItem> {
    key: string;
    actions: IProjectActions;
    project: IProject;
    active: boolean;
    onClick: (item: ToolbarItem) => void;
}

export abstract class ToolbarItem extends React.Component<IToolbarItemProps> {
    constructor(props, context) {
        super(props, context);

        this.onItemClick = this.onItemClick.bind(this);
        this.onClick = this.onClick.bind(this);
    }

    public render() {
        const className = ["toolbar-btn"];
        if (this.props.active) {
            className.push("active");
        }

        return (
            <button type="button"
                className={className.join(" ")}
                title={this.props.tooltip}
                onClick={this.onClick}>
                <i className={"fas " + this.props.icon} />
            </button>
        );
    }

    protected abstract onItemClick();

    private onClick() {
        this.onItemClick();
        this.props.onClick(this);
    }
}
