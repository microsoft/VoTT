import React, { Component } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import Navbar from './components/shell/navbar';
import Sidebar from './components/shell/sidebar';
import MainContentRouter from './components/shell/mainContentRouter';
import createReduxStore from './store/store';
import './App.scss';
import ApplicationState from './store/applicationState';

const defaultState: ApplicationState = {
    appSettings: {
        devToolsEnabled: false
    }
}
const store = createReduxStore();

class App extends Component {
    render() {
        return (
            <Provider store={store}>
                <Router>
                    <div className="app-shell">
                        <Navbar />
                        <div className="app-main">
                            <Sidebar />
                            <MainContentRouter />
                        </div>
                    </div>
                </Router>
            </Provider>
        );
    }
}

export default App;
