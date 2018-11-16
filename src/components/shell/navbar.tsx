import React from 'react';

export default function Navbar() {
    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
            <a className="navbar-brand" href="#">VoTT</a>
            <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                <span className="navbar-toggler-icon"></span>
            </button>

            <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <ul className="navbar-nav mr-auto">
                    <li className="nav-item active">
                        <a className="nav-link" href="#">File <span className="sr-only">(current)</span></a>
                    </li>
                    <li className="nav-item active">
                        <a className="nav-link" href="#">Object Dectection <span className="sr-only">(current)</span></a>
                    </li>
                    <li className="nav-item active">
                        <a className="nav-link" href="#">Edit <span className="sr-only">(current)</span></a>
                    </li>
                    <li className="nav-item active">
                        <a className="nav-link" href="#">Filters <span className="sr-only">(current)</span></a>
                    </li>
                    <li className="nav-item active">
                        <a className="nav-link" href="#">Debug <span className="sr-only">(current)</span></a>
                    </li>
                    <li className="nav-item active">
                        <a className="nav-link" href="#">Window <span className="sr-only">(current)</span></a>
                    </li>
                    <li className="nav-item active">
                        <a className="nav-link" href="#">Help <span className="sr-only">(current)</span></a>
                    </li>
                </ul>
            </div>
        </nav>
    );
}