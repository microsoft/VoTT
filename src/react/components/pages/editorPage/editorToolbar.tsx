import React from "react";
import _ from "lodash";
import { ToolbarItemFactory, IComponentRegistration } from "../../../../providers/toolbar/toolbarItemFactory";
import IProjectActions from "../../../../redux/actions/projectActions";
import { IProject } from "../../../../models/applicationState";
import { IToolbarItemProps, ToolbarItem, ToolbarItemType } from "../../toolbar/toolbarItem";
import "./editorToolbar.scss";
import { Select } from "../../toolbar/select";

export interface IEditorToolbarProps {
    project: IProject;
    actions: IProjectActions;
}

export interface IEditorToolbarState {
    selectedItem: any;
}

export class EditorToolbar extends React.Component<IEditorToolbarProps, IEditorToolbarState> {
    constructor(props, context) {
        super(props, context);

        this.state = {
            selectedItem: Select.prototype,
        };

        this.onToolbarItemSelected = this.onToolbarItemSelected.bind(this);
    }

    public render() {
        const toolbarItems = ToolbarItemFactory.getToolbarItems();
        const groups = _(toolbarItems)
            .groupBy("config.group")
            .values()
            .value();

        return (
            <div className="btn-toolbar" role="toolbar">
                {groups.map((items) =>
                    <div className="btn-group mr-2" role="group">
                        {items.map((registration) => {
                            const toolbarItemProps: IToolbarItemProps = {
                                ...this.props,
                                ...registration.config,
                                key: registration.key,
                                active: this.isComponentActive(this.state.selectedItem, registration),
                                onClick: this.onToolbarItemSelected,
                            };
                            const ToolbarItem = registration.component;

                            return <ToolbarItem {...toolbarItemProps} />;
                        })}
                    </div>,
                )}
            </div>
        );
    }

    private onToolbarItemSelected(toolbarItem: ToolbarItem) {
        this.setState({
            selectedItem: Object.getPrototypeOf(toolbarItem),
        });
    }

    private isComponentActive(selected: any, componentRegistration: IComponentRegistration) {
        return selected
            ? selected === componentRegistration.component.prototype &&
            componentRegistration.config.type === ToolbarItemType.State
            : false;
    }
}
