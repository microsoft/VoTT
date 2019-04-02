import React, { Fragment, SyntheticEvent } from "react";
import { IProject } from "../../../models/applicationState";
import IProjectActions from "../../../redux/actions/projectActions";
import { IKeyboardContext, KeyboardContext, KeyEventType } from "../common/keyboardManager/keyboardManager";
import { KeyboardBinding } from "../common/keyboardBinding/keyboardBinding";
import { ToolbarItemName, ToolbarItemGroup } from "../../../registerToolbar";

/**
 * Toolbar Item Metadata
 * @member name - Name of Toolbar Item
 * @member icon - Icon for toolbar item
 * @member tooltip - Tooltip to apply upon selection
 * @member group - Name of item group in which to include item
 * @member type - Type of toolbar item (Action or State)
 * @member accelerators - collection of accelerator that map to same action
 */
export interface IToolbarItemMetadata {
    name: ToolbarItemName;
    icon: string;
    tooltip: string;
    group: ToolbarItemGroup;
    type: ToolbarItemType;
    accelerators?: string[];
}

/**
 * Types of Toolbar items
 * @member Action - Toolbar item executes an action (export)
 * @member State - Toolbar item changes something about the state of the component (Draw Polygon)
 */
export enum ToolbarItemType {
    Action = 0,
    State = 1,
}

/**
 * Properties for Toolbar Item
 * @member actions - Project actions
 * @member project - Current project being edited
 * @member active - Toolbar is active
 * @member onClick - Function to be called on click of Toolbar Item
 */
export interface IToolbarItemProps extends IToolbarItemMetadata {
    actions: IProjectActions;
    project: IProject;
    active: boolean;
    onClick: (item: ToolbarItem) => void;
}

/**
 * @name - Toolbar Item
 * @description - Controls for Editor Page Toolbar
 */
export abstract class ToolbarItem extends React.Component<IToolbarItemProps> {
    public static contextType = KeyboardContext;
    public context!: IKeyboardContext;
    private unregisterKeyboardHandler: () => void;

    public componentWillUnmount() {
        if (this.unregisterKeyboardHandler) {
            this.unregisterKeyboardHandler();
        }
    }

    public render() {
        const className = [`toolbar-btn ${this.props.name}`];
        if (this.props.active) {
            className.push("active");
        }

        const accelerators = this.props.accelerators;

        return (
            <Fragment>
                {
                    accelerators &&
                    <KeyboardBinding
                        displayName={this.props.tooltip}
                        accelerators={accelerators}
                        handler={this.onClick}
                        icon={this.props.icon}
                        keyEventType={KeyEventType.KeyDown}
                    />
                }
                <button type="button"
                    className={className.join(" ")}
                    title={this.getTitle()}
                    onClick={this.onClick}>
                    <i className={"fas " + this.props.icon} />
                </button>
            </Fragment>
        );
    }

    protected abstract onItemClick();

    private getTitle = () => {
        return `${this.props.tooltip}${this.getShortcut()}`;
    }

    private getShortcut = () => {
        return ` (${this.consolidateKeyCasings(this.props.accelerators).join(", ")})`;
    }

    private consolidateKeyCasings = (accelerators: string[]): string[] => {
        const consolidated: string[] = [];
        if (accelerators) {
            for (const a of accelerators) {
                if (!consolidated.find((item) => item.toLowerCase() === a.toLowerCase())) {
                    consolidated.push(a);
                }
            }
        }
        return consolidated;
    }

    private onClick = (e: SyntheticEvent | KeyboardEvent) => {
        e.stopPropagation();

        if (this.onItemClick) {
            this.onItemClick();
        }
        this.props.onClick(this);
    }
}
