import React from "react";
import Form, { FormValidation, ISubmitEvent, IChangeEvent, Widget } from "react-jsonschema-form";
import { EditorContext, IAssetMetadata, IProject, IRegion, ISegment } from "../../../../models/applicationState";
import SegmentCanvas from "../../pages/editorPage/segment/segmentCanvas";


export interface IPropertyFormProps extends React.Props<PropertyForm> {
    assetMetadata: IAssetMetadata;
    editorContext: EditorContext;
    selectedTag: string;
    isLoading: boolean,
    onAssetMetadataChanged: (newAssetMetadata: IAssetMetadata) => void;
}

export interface IPropertyFormState {
    iscrowd: boolean;
}

/**
 * @name - Property Form
 * @description - Form for editing properties of choosen assets
 */
export default class PropertyForm extends React.Component<IPropertyFormProps, IPropertyFormState> {
    public static defaultProps: IPropertyFormProps = {
        assetMetadata: undefined,
        editorContext: EditorContext.Geometry,
        selectedTag: undefined,
        isLoading: true,
        onAssetMetadataChanged: undefined,
    }

    public state: IPropertyFormState = {
        iscrowd: false,
    }

    constructor(props){
        super(props);
        this.handleInputChange = this.handleInputChange.bind(this);
    }

    public componentDidUpdate(prevProps: IPropertyFormProps){
        if (this.props.assetMetadata){
            const previousSegment = this.getSegmentByTag(prevProps.assetMetadata, prevProps.selectedTag);
            const segment = this.getSegmentByTag(this.props.assetMetadata, this.props.selectedTag);
            if (this.props.assetMetadata !== prevProps.assetMetadata){
                if (segment){
                    this.updateSegmentProperty(segment.iscrowd);
                }
            }
            if (segment && previousSegment && segment !== previousSegment){
                this.updateSegmentProperty(segment.iscrowd);
            }
        }
    }

    public render() {
        return (
            <div>{this.showProperties(this.props.assetMetadata, this.props.selectedTag)}</div>
        );
    }

    public updateSegmentProperty(value: number){
        this.setState( { iscrowd: value === 1 });
    }

    public getSegmentByTag = (assetMetadata: IAssetMetadata, tag: string): ISegment => {
        if (tag){
            const selectedSegments = assetMetadata.segments.filter( (s) => s.tag === tag );
            if (selectedSegments && selectedSegments.length) {
                return selectedSegments[0];
            }
        }
    }

    private handleInputChange(event){
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const updated = this.getUpdatedAssetMetadata(value ? 1 : 0);
        this.props.onAssetMetadataChanged(updated);
        this.updateSegmentProperty(value ? 1 : 0);
    }

    private getUpdatedAssetMetadata = (value: number): IAssetMetadata => {
        if (this.props.selectedTag) {
            const updatedAssetMetadata: IAssetMetadata = { ... this.props.assetMetadata, segments:
                this.props.assetMetadata.segments.map( (s: ISegment) => { return s.tag === this.props.selectedTag ? {... s, iscrowd: value } : s })
                };
            return updatedAssetMetadata;
        }
    }

    private showProperties(assetMetadata: IAssetMetadata, selectedTag: string){
        if (this.props.assetMetadata){
            const segment = this.getSegmentByTag(assetMetadata, selectedTag);
            if (this.props.editorContext === EditorContext.Segment && segment){
                return <div><h2>{ segment.tag }</h2>
                    <p>iscrowd : <input
                    name="iscrowd"
                    type="checkbox"
                    checked={this.state.iscrowd}
                    onChange={this.handleInputChange} />
                    </p></div>;
            }
            else if(this.props.editorContext === EditorContext.Geometry){
                return "";
            }
            else {
                return "Please choose region/segment to configure.";
            }
        }
        else{
            return "Loading asset....";
        }
    }
}