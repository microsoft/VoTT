import React from "react";
import ReactModal from "react-modal";
import Form from "react-jsonschema-form";
import "./tagEditorModal.scss";
import { ITag } from "../../../../../models/applicationState";
// tslint:disable-next-line:no-var-requires
const formSchema = require("./tagEditorModal.json");

const customStyles = {
    content : {
      top                   : "50%",
      left                  : "50%",
      right                 : "auto",
      bottom                : "auto",
      marginRight           : "-50%",
      transform             : "translate(-50%, -50%)",
      zIndex                : 1,
    },
  };

interface ITagEditorModalProps {
    tag: ITag;
    showModal: boolean;
    onOk: (value) => void;
    onCancel: (value) => void;
}

interface ITagEditorModalState {
    tag: ITag;
    formData: any;
    isOpen: boolean;
}

export class TagEditorModal extends React.Component<ITagEditorModalProps, ITagEditorModalState> {

    constructor(props: ITagEditorModalProps) {
        super(props);
        this.state = {
            tag: props.tag,
            formData: {},
            isOpen: false,
        };
        this.handleFormChange = this.handleFormChange.bind(this);
        this.handleOk = this.handleOk.bind(this);
    }

    public componentDidUpdate(prevProps) {
        if (this.props.tag && prevProps.tag !== this.props.tag) {
            this.setState({
                tag: this.props.tag,
            });
        }
    }

    public handleFormChange(results) {
        this.setState({
            tag: {
                name: results.formData.name,
                color: results.formData.color,
            },
        });
    }

    public handleOk() {
        this.props.onOk(this.state.tag);
    }

    public render() {
        return (
            <div>
                <ReactModal
                    isOpen={this.props.showModal}
                    ariaHideApp={false}
                    style={customStyles}
                    >

                    <Form
                        schema={formSchema}
                        onChange={this.handleFormChange}
                        formData={{
                            name: (this.state.tag) ? this.state.tag.name : null,
                            color: (this.state.tag) ? this.state.tag.color : null,
                        }}>
                        <button type="button" onClick={this.props.onCancel}>Close</button>
                        <button type="button" onClick={this.handleOk}>OK</button>
                    </Form>
                </ReactModal>
            </div>
        );
    }
}
