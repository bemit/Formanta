import React, {Component} from 'react';
import {
    NavLink as Link
} from 'react-router-dom';


import './Nav.scss';

export default class Nav extends Component {

    render() {
        const Aux = props => props.children;
        return (
            <Aux>
                <ul>
                    <li><Link to="/page-link">Page-Link</Link></li>
                    <li><Link to="/page-link-2">Page-Link2</Link></li>
                </ul>
            </Aux>
        )
    };
}