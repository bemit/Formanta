// Lib
import React, {Component} from 'react';

// Assets
import './Dashboard.scss';

// exec
const Aux = props => props.children;

export default class Dashboard extends Component {
    render() {
        return (
            <Aux>
                <p>Welcome to the administration</p>
                <p>Lorem ipsum sic dolor amet...</p>
            </Aux>
        )
    }
}