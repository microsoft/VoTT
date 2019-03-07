import React from "react";
import { ITag, ITagMetadata } from "../../../../models/applicationState";
import { invertColor } from "../../../../common/utils";

export interface IVerticalTagInputItemProps {
    item: ITagMetadata;
    onClick: (e) => void;
    onDelete: (e) => void;
}

export interface IVerticalTagInputItemState {

}

export class VerticalTagInputItem extends React.Component<IVerticalTagInputItemProps, IVerticalTagInputItemState> {
    

    render() {
        return (
            <li className="tag-item" onClick={this.props.onClick}>
                <table><tr>
                    <td className={"tag-color"} style={
                        {
                            backgroundColor: this.props.item.color,
                            color: invertColor(this.props.item.color),
                            display: "flex",
                            justifyContent: "center",
                        }
                    }>{this.getDisplayIndex()}</td>
                    <td className={"tag-content"}>
                        <span className="px-2">{this.props.item.name}</span>
                    </td>
                </tr></table>
            </li>
        )
    }

    private getColorStyle = () => {
        return 
    }

    private getDisplayIndex = () => {
        const index = this.props.item.index;
        const displayIndex = (index === 9) ? 0 : index + 1;
        return (index < 10) ? displayIndex : " ";
    }

    
}