// Lib
import React, {Component} from 'react';

import {
    BrowserRouter as Router,
    Route,
    Redirect
} from 'react-router-dom';
import RouteStore from '../lib/RouteStore';

// Components
import Nav from '../component/nav/Nav';
import Header from '../component/header/Header';

import Loadable from 'react-loadable';
import Loading from './Loading/Loading';
// asset
import './Base.scss';

// todo: move to own file
const Sidebar = () => (
    <div className="sidebar">
        <Nav/>
    </div>
);

export default class Base extends Component {

    constructor() {
        super();
        RouteStore.add('dashboard', {any: 'dashboard'});
        RouteStore.add('login', {any: 'auth'});
    }

    render() {
        let logged_in = false;

        const Aux = props => props.children;
        return (
            <Router basename="/">
                <Aux>
                    <Header/>

                    <div className="content-pane">
                        <Route path={'/' + RouteStore.get('dashboard')} component={Sidebar}/>

                        <div className="content">
                            <Route path={'/' + RouteStore.get('dashboard')} component={Loadable({
                                loader: () => import('./Dashboard/Dashboard'),
                                loading: Loading,
                            })}/>
                            <Route path={'/' + RouteStore.get('login')} component={Loadable({
                                loader: () => import('./Login/Login'),
                                loading: Loading,
                            })}/>
                        </div>
                    </div>

                    {/* todo: add auth check in more levels and not just a redirect on `/` url */}
                    <Route exact path="/" render={() => (
                        logged_in ? (
                            <Redirect to={'/' + RouteStore.get('dashboard')}/>
                        ) : (
                            <Redirect to={'/' + RouteStore.get('login')}/>
                        )
                    )}/>
                </Aux>
            </Router>
        )
    };
}