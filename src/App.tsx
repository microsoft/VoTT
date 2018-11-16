import React, { Component } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Navbar from './components/shell/navbar';
import Sidebar from './components/shell/sidebar';
import MainContentRouter from './components/shell/mainContentRouter';
import './App.scss';

class App extends Component {
  render() {
    return (
      <Router>
        <div className="app-shell">
          <Navbar />
          <div className="app-main">
            <Sidebar />
            <MainContentRouter />
          </div>
        </div>
      </Router>
    );
  }
}

export default App;
