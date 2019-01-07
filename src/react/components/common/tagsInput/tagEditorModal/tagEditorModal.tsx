import React from "react";
import Form from "react-jsonschema-form";
import { Button, Modal, ModalBody, ModalHeader, ModalFooter } from "reactstrap";
import { addLocValues } from "../../../../../common/strings";
import { ITag } from "../../../../../models/applicationState";
// tslint:disable-next-line:no-var-requires
const formSchema = addLocValues(require("./tagEditorModal.json"));

export interface ITagEditorModalProps {
    tag: ITag;
    showModal: boolean;
    onOk: (tag: ITag) => void;
    onCancel: () => void;
}

export interface ITagEditorModalState {
    tag: ITag;
    isOpen: boolean;
}

/**
 * Simple modal for editing the name and color of project tags
 */
export default class TagEditorModal extends React.Component<ITagEditorModalProps, ITagEditorModalState> {

    constructor(props: ITagEditorModalProps) {
        super(props);
        this.state = {
            tag: props.tag,
            isOpen: props.showModal,
        };
        this.handleFormChange = this.handleFormChange.bind(this);
        this.handleOk = this.handleOk.bind(this);
    }

    public render() {
        const closeBtn = <button className="close" onClick={this.props.onCancel}>&times;</button>;

        return (
            <div>
                <Modal isOpen={this.state.isOpen} centered={true}>
                    <ModalHeader toggle={this.props.onCancel} close={closeBtn}>Edit Tag</ModalHeader>
                    <ModalBody>
                        <Form
                            schema={formSchema}
                            formData={this.state.tag}
                            onChange={this.handleFormChange}>
                            <div></div>
                        </Form>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            color="success"
                            onClick={this.handleOk}>Save</Button>
                        <Button
                            color="secondary"
                            onClick={this.props.onCancel}>Cancel</Button>
                    </ModalFooter>
                </Modal>
            </div>
        );
    }

    /**
     * Updates tag in modal if necessary
     * @param prevProps Previous properties with `tag` attribute
     */
    public componentDidUpdate(prevProps) {
        if (this.props.tag && prevProps.tag !== this.props.tag) {
            this.setState({
                tag: this.props.tag,
            });
        }
        if (prevProps.showModal !== this.props.showModal) {
            this.setState({
                isOpen: this.props.showModal,
            });
        }
    }

    /**
     * Called when change made to modal form
     */
    private handleFormChange(args) {
        this.setState({
            tag: {
                name: args.formData.name,
                color: args.formData.color,
            },
        });
    }

    /**
     * Called when 'Ok' is clicked
     */
    private handleOk(e) {
        this.props.onOk(this.state.tag);
    }
}
