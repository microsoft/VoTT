import React from "react";
import _ from "lodash";
import { IToolbarItemRegistration } from "../../../../providers/toolbar/toolbarItemFactory";
import IProjectActions from "../../../../redux/actions/projectActions";
import { IProject, EditorMode } from "../../../../models/applicationState";
import { IToolbarItemProps, ToolbarItem, ToolbarItemType } from "../../toolbar/toolbarItem";
import "./editorToolbar.scss";
import { Select } from "../../toolbar/select";

/**
 * Properties for Editor Toolbar
 * @member project - Current project being edited
 * @member actions - Actions to be performed on project
 * @member items - Registered Toolbar items
 */
export interface IEditorToolbarProps {
    project: IProject;
    actions: IProjectActions;
    items: IToolbarItemRegistration[];
    onToolbarItemSelected: (toolbarItem: ToolbarItem) => void;
}

/**
 * State of IEditorToolbar
 * @member selectedItem - Item selected from toolbar
 */
export interface IEditorToolbarState {
    selectedItem: any;
}

/**
 * @name - Editor Toolbar
 * @description - Collection of buttons that perform actions in toolbar on editor page
 */
export class EditorToolbar extends React.Component<IEditorToolbarProps, IEditorToolbarState> {
    constructor(props, context) {
        super(props, context);

        this.state = {
            selectedItem: Select.prototype,
        };

        this.onToolbarItemSelected = this.onToolbarItemSelected.bind(this);
    }

    public render() {
        const groups = _(this.props.items)
            .groupBy("config.group")
            .values()
            .value();

        return (
            <div className="btn-toolbar" role="toolbar">
                {groups.map((items, idx) =>
                    <div key={idx} className="btn-group mr-2" role="group">
                        {items.map((registration) => {
                            const toolbarItemProps: IToolbarItemProps = {
                                ...registration.config,
                                actions: this.props.actions,
                                project: this.props.project,
                                active: this.isComponentActive(this.state.selectedItem, registration),
                                onClick: this.onToolbarItemSelected,
                            };
                            const ToolbarItem = registration.component;

                            return <ToolbarItem key={toolbarItemProps.name} {...toolbarItemProps} />;
                        })}
                    </div>,
                )}
            </div>
        );
    }

    private onToolbarItemSelected(toolbarItem: ToolbarItem) {
        this.setState({
            selectedItem: Object.getPrototypeOf(toolbarItem),
        }, () => {
            this.props.onToolbarItemSelected(toolbarItem);
        });
    }

    private isComponentActive(selected: any, componentRegistration: IToolbarItemRegistration) {
        return selected
            ? selected === componentRegistration.component.prototype &&
            componentRegistration.config.type === ToolbarItemType.State
            : false;
    }
}
