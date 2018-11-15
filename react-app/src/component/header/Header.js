// Lib
import React, {Component} from 'react';
import {
    Link
} from 'react-router-dom';

// Asset
//import logo from '../../../../asset/media/example_SVG_small.svg';
import './Header.scss';

export default class Header extends Component {
    constructor(props) {
        super(props);
        this.slogan = 'Formanta in React';
    }

    componentDidMount() {
    }

    render() {
        return (
            <div className="header">
                <div className="header--logo">
                    {/*<Link to="/dashboard"><img src={logo} alt="Logo"/></Link>*/}
                </div>
                <p className="header--logo--slogan">{this.slogan}</p>
            </div>
        )
    };
}