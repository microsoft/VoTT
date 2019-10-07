import React, { ReactElement } from "react";

export function MagnifierModalMessage(): ReactElement<any> {
    return (
        <div>
        Application does not have it's own magnifier, but you could use
        native magnifier of your operating system. Below are videos which
        shows how to use native magnifiers on macOS, Ubuntu and Windows 10.
        <br />
        <div>
            <i className="fab fa-apple" /> macOS -
            &nbsp;<a href="https://youtu.be/bz2JrEwvFWs" target="_blank">click here</a>
        </div>
        <div>
            <i className="fab fa-ubuntu" /> Ubuntu -
            &nbsp;<a href="https://youtu.be/pFwblGYjzSs" target="_blank">click here</a>
        </div>
        <div>
            <i className="fab fa-windows" /> Windows 10 -
            &nbsp;<a href="https://youtu.be/xNhF1NJ78NE" target="_blank">click here</a>
        </div>
    </div>
    );
}
