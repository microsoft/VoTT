import React from "react";
import Form, { FormValidation, ISubmitEvent, IChangeEvent, Widget } from "react-jsonschema-form";
import { EditorContext, IAssetMetadata, IProject, IRegion, ISegment } from "../../../../models/applicationState";


export interface IPropertyFormProps extends React.Props<PropertyForm> {
    editorContext: EditorContext;
    selectedRegions: IRegion[];
    selectedSegment: ISegment;
}

export interface IPropertyFormState {

}

/**
 * @name - Property Form
 * @description - Form for editing properties of choosen assets
 */
export default class PropertyForm extends React.Component<IPropertyFormProps, IPropertyFormState> {

    public componentDidUpdate(prevProps: IPropertyFormProps){
    }

    public render() {
        return (
            <div>{this.showProperties()}</div>
        );
    }

    private showProperties(){
        if (this.props.editorContext === EditorContext.Segment && this.props.selectedSegment){
            return this.props.selectedSegment.tag;
        }
        else if(this.props.editorContext === EditorContext.Geometry && this.props.selectedRegions){
            return this.props.selectedRegions.length;
        }
        else {
            return "Please choose region/segment to configure.";
        }
    }
}