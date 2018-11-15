// Lib
import React, {Component} from 'react';

// Assets
import './style--inwards.scss';

export default class Inwards extends Component {
    render() {
        return (
            <div className={(this.props.className ? this.props.className + ' ' : '') + "loading--inwards"}>
                <span></span>
                <span></span>
                <span></span>
            </div>
        )
    };
}