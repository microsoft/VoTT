import React from "react";
import Form, { FormValidation, ISubmitEvent, IChangeEvent, Widget } from "react-jsonschema-form";
import { EditorContext, IAssetMetadata, IProject, IRegion, ISegment } from "../../../../models/applicationState";
import { JSONSchema6 } from "json-schema";
import SegmentCanvas from "../../pages/editorPage/segment/segmentCanvas";
import { update } from "lodash";

const formSchemaForSegment = {
    "title": "Segment property",
    "type": "object",
    "properties": {
      "tag": {
        "type": "string"
      },
      "iscrowd": {
        "type": "boolean"
      }
    }
}

const uiSchema =  {
    iscrowd: {
      "ui:widget": "radio" // could also be "select"
    }
};

export interface IPropertyFormProps extends React.Props<PropertyForm> {
    selectedAssetName: string,
    editorContext: EditorContext;
    selectedRegions: IRegion[];
    selectedSegment: ISegment;
    onSegmentsUpdated: (segments: ISegment[], needToIntegrate: boolean) => void;
    onSelectedSegmentChanged: (segment: ISegment) => void;
}

export interface IPropertyFormState {
    iscrowd: boolean;
    formSchema: object;
    formData: object;
}

/**
 * @name - Property Form
 * @description - Form for editing properties of choosen assets
 */
export default class PropertyForm extends React.Component<IPropertyFormProps, IPropertyFormState> {
    public static defaultProps: IPropertyFormProps = {
        selectedAssetName: "",
        editorContext: EditorContext.Geometry,
        selectedRegions: [],
        selectedSegment: undefined,
        onSegmentsUpdated: undefined,
        onSelectedSegmentChanged: undefined,
    }

    public state: IPropertyFormState = {
        iscrowd: false,
        formSchema: undefined,
        formData: undefined,
    }

    constructor(props){
        super(props);
        this.updateForm = this.updateForm.bind(this);
        this.clearForm = this.clearForm.bind(this);
    }

    public componentDidUpdate(prevProps: IPropertyFormProps){
        if (this.props.editorContext === EditorContext.Segment){
            if (this.props.selectedAssetName !== prevProps.selectedAssetName){
                this.clearForm();
            }
            else if (this.props.selectedSegment){
                if (!this.state.formData){
                    this.updateForm(this.props.selectedSegment, formSchemaForSegment);
                }
                if(this.props.selectedSegment !== prevProps.selectedSegment){
                    this.updateForm(this.props.selectedSegment, formSchemaForSegment);
                }
            }
            else if (this.state.formData) {
                this.clearForm();
            }
        }
    }

    public clearForm(){
        this.setState( { formData: undefined } );
    }

    public updateForm(segment: ISegment, formSchema: object){
        const formData = this.projectSegmentIntoFormData(segment, formSchema);
        this.setState( { formData } );
    }

    public render() {
        return (
            this.state.formData ?
            <Form
                className={"annotation-property-form"}
                schema={ formSchemaForSegment as JSONSchema6}
                uiSchema={uiSchema}
                formData={this.state.formData}
                onChange={this.onFormChange}
                />
            : ""
        );
    }

    public updateSegmentProperty(value: number){
        this.setState( { iscrowd: value === 1 });
    }

    private projectSegmentIntoFormData(segment: ISegment, formSchema: object){
        const segmentAttributes = Object.getOwnPropertyNames(segment);
        let projected = {};
        for (const key in formSchema)
        {
            if(key === "properties")
            {
                for (const attr in formSchema[key]){
                    if (segmentAttributes.includes(attr)){
                        if (formSchema[key][attr]["type"] === "boolean"){
                            projected = {...projected, [attr]: segment[attr] === 1};
                        } else {
                            projected = {...projected, [attr]: segment[attr]};
                        }
                    }
                }
            }
        }
        return projected;
    }

    private projectFormDataIntoSegment = (formData: object, segment: ISegment): ISegment => {
        const segmentAttributes = Object.getOwnPropertyNames(segment);
        let projected = {... segment};
        for (const attr in formData){
            if (segmentAttributes.includes(attr)){
                if (typeof formData[attr] === "boolean"){
                    projected = {...projected, [attr]: formData[attr] ? 1 : 0};
                } else {
                    projected = {...projected, [attr]: formData[attr]};
                }
            }
        }
        return projected;
    }

    private onFormChange = (changeEvent: IChangeEvent<IPropertyFormProps>) => {
        if (this.props.selectedSegment){
            const updated = this.projectFormDataIntoSegment(changeEvent.formData, this.props.selectedSegment);
            if (this.props.onSegmentsUpdated && updated && this.props.onSelectedSegmentChanged) {
                this.props.onSegmentsUpdated([updated], true);
                this.props.onSelectedSegmentChanged(updated);
            }
        }
    }
}