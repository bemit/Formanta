import React, {Component} from 'react';
import './Loading.scss';

export default class Loading extends Component {
    render() {
        const Aux = props => props.children;
        return (
            <Aux>
                <p className="loading--slogan">Earth is spinning ...</p>
                <div className="loading--dots"><span></span><span></span><span></span></div>
            </Aux>
        )
    };
}