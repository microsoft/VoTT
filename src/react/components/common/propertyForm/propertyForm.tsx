import React from "react";
import Form, { FormValidation, ISubmitEvent, IChangeEvent, Widget } from "react-jsonschema-form";
import { EditorContext, IAssetMetadata, IProject, IRegion, ISegment } from "../../../../models/applicationState";
import { JSONSchema6 } from "json-schema";
import SegmentCanvas from "../../pages/editorPage/segment/segmentCanvas";
import { update } from "lodash";

const formSchemaForSegment = {
    title: "Annotation property",
    type: "object",
    properties: {
        tag: {
            type: "string"
        },
        iscrowd: {
            type: "boolean",
            default: false,
        },
        risk: {
            type: "string",
            enum: ["safe", "danger", "caution"],
            default: "safe",
        }
    }
}

const formSchemaForRegion = {
    title: "Annotation property",
    type: "object",
    properties: {
        tag: {
            type: "string"
        },
        istruncated: {
            type: "boolean",
            default: false,
        },
        isobscured: {
            type: "boolean",
            default: false,
        },
        risk: {
            type: "string",
            enum: ["safe", "danger", "caution"],
            default: "safe",
        },
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
    selectedRegions?: IRegion[];
    selectedSegment?: ISegment;
    onSegmentsUpdated?: (segments: ISegment[], needToIntegrate: boolean) => void;
    onSelectedSegmentChanged?: (segment: ISegment) => void;
    onRegionsUpdated?: (regions: IRegion[], needToIntegrate: boolean) => void;
    onSelectedRegionsChanged?: (regions: IRegion[]) => void;
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
        onSelectedRegionsChanged: undefined,
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
        if (this.props.editorContext !== prevProps.editorContext ) {
            this.clearForm();
        }
        if (this.props.editorContext === EditorContext.Segment){
            if (this.props.selectedAssetName !== prevProps.selectedAssetName){
                this.clearForm();
            }
            else if (this.props.selectedSegment){
                if (!this.state.formData){
                    this.updateForm(undefined, this.props.selectedSegment, formSchemaForSegment);
                }
                if(this.props.selectedSegment !== prevProps.selectedSegment){
                    this.updateForm(undefined, this.props.selectedSegment, formSchemaForSegment);
                }
            }
            else if (this.state.formData) {
                this.clearForm();
            }
        }
        else if(this.props.editorContext === EditorContext.Geometry){
            if (this.props.selectedAssetName !== prevProps.selectedAssetName){
                this.clearForm();
            }
            else if (this.props.selectedRegions && this.props.selectedRegions.length === 1){
                if (!this.state.formData){
                    this.updateForm(this.props.selectedRegions, undefined, formSchemaForRegion);
                }
                if(this.props.selectedRegions !== prevProps.selectedRegions){
                    this.updateForm(this.props.selectedRegions, undefined, formSchemaForRegion);
                }
            }
            else if (this.props.selectedRegions && this.props.selectedRegions.length === 0 && this.state.formData) {
                this.clearForm();
            }
        }
    }

    public clearForm(){
        this.setState( { formData: undefined } );
    }

    public updateForm(regions: IRegion[], segment: ISegment, formSchema: object){
        if (regions && regions.length === 1){
            const formData = this.projectRegionIntoFormData(regions[0], formSchema);
            this.setState( { formData } );
        }
        else if (segment){
            const formData = this.projectSegmentIntoFormData(segment, formSchema);
            this.setState( { formData } );
        }
    }

    public render() {
        return (
            <div onClick={(e) => e.stopPropagation()}>
                {
                    this.state.formData ?
                    <Form
                        className={"annotation-property-form"}
                        schema={ this.props.editorContext === EditorContext.Segment
                            ? formSchemaForSegment as JSONSchema6 : formSchemaForRegion as JSONSchema6 }
                        uiSchema={uiSchema}
                        formData={this.state.formData}
                        onChange={this.onFormChange}
                        />
                    : ""
                }
            </div>
        );
    }

    private projectRegionIntoFormData(region: IRegion, formSchema: object){
        const regionAttributes = Object.getOwnPropertyNames(region);
        let projected = {};
        for (const key in formSchema)
        {
            if(key === "properties")
            {
                for (const attr in formSchema[key]){
                    if (regionAttributes.includes(attr)){
                        if (formSchema[key][attr]["type"] === "boolean"){
                            projected = {...projected, [attr]: region[attr] === 1};
                        } else {
                            projected = {...projected, [attr]: region[attr]};
                        }
                    }
                }
            }
        }
        return projected;
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

    private projectFormDataIntoRegion = (formData: object, region: IRegion): IRegion => {
        const regionAttributes = Object.getOwnPropertyNames(region);
        let projected = {... region};
        for (const attr in formData){
            if (regionAttributes.includes(attr)){
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
        if (this.props.editorContext === EditorContext.Segment && this.props.selectedSegment){
            const updated = this.projectFormDataIntoSegment(changeEvent.formData, this.props.selectedSegment);
            if (this.props.onSegmentsUpdated && updated && this.props.onSelectedSegmentChanged) {
                this.props.onSegmentsUpdated([updated], true);
                this.props.onSelectedSegmentChanged(updated);
            }
        }
        else if (this.props.editorContext === EditorContext.Geometry 
                && this.props.selectedRegions && this.props.selectedRegions.length === 1){
            const updated = this.projectFormDataIntoRegion(changeEvent.formData, this.props.selectedRegions[0]);
            if (this.props.onRegionsUpdated && updated && this.props.onSelectedRegionsChanged) {
                this.props.onRegionsUpdated([updated], true);
                this.props.onSelectedRegionsChanged([updated]);
            }
        }
    }
}