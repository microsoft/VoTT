import React from "react";
import ReactDOM from "react-dom";

export class Portal extends React.Component {
    private el: any = document.createElement("div");
    private portalRoot: any = document.getElementById("portal");

    public componentDidMount = () => {
        this.portalRoot.appendChild(this.el);
    }

    public componentWillUnmount = () => {
        this.portalRoot.removeChild(this.el);
    }

    public render() {
        const {children} = this.props;
        return ReactDOM.createPortal(children, this.el);
    }
}
