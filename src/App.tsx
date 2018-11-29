import React from "react";
import { connect } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import Navbar from "./components/shell/navbar";
import Sidebar from "./components/shell/sidebar";
import MainContentRouter from "./components/shell/mainContentRouter";
import ApplicationState, { IProject } from "./store/applicationState";
import "./App.scss";

interface IAppProps {
    currentProject?: IProject;
}

function mapStateToProps(state: ApplicationState) {
    return {
        currentProject: state.currentProject,
    };
}

@connect(mapStateToProps)
class App extends React.Component<IAppProps> {
    constructor(props, context) {
        super(props, context);

        this.state = {
            currentProject: this.props.currentProject,
        };
    }

    public render() {
        return (
            <Router>
                <div className="app-shell">
                    <Navbar />
                    <div className="app-main">
                        <Sidebar project={this.props.currentProject} />
                        <MainContentRouter />
                    </div>
                </div>
            </Router>
        );
    }
}

export default App;
