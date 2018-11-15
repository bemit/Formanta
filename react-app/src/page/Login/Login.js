import React, {Component} from 'react';
import {
    Redirect
} from 'react-router-dom';

import Pulse from '../../component/loading/Inwards';

// Assets
import './Login.scss';

export default class Login extends Component {
    state = {
        success: false,
        auth_process: false,
        user: '',
        pass: '',
    };

    constructor(props) {
        super(props);

        this.handleChangeUser = this.handleChangeUser.bind(this);
        this.handleChangePass = this.handleChangePass.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChangeUser(evt) {
        this.setState({user: evt.target.value});
    }

    handleChangePass(evt) {
        this.setState({pass: evt.target.value});
    }

    handleSubmit = (evt) => {
        evt.preventDefault();

        // todo: just a mocking auth check
        this.setState(() => ({
            auth_process: 'authenticating'
        }));

        const verify = (name, pass) => {
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve(true);
                }, 450);
            });
        };

        verify(
            evt.target.querySelector('[name="user"]').value,
            evt.target.querySelector('[name="password"]').value
        ).then((res) => {
            if(res) {
                this.setState(() => ({
                    auth_process: 'authenticated'
                }));
            } else {
                this.setState(() => ({
                    auth_process: 'auth-mismatch'
                }));
            }
        });
    };

    render() {

        if(this.state.auth_process === 'authenticated') {
            return <Redirect to="/dashboard"/>
        }

        let className = [];

        if(this.state.auth_process) {
            className.push(this.state.auth_process);
        }

        return (
            <div className='auth'>
                <p className="auth--intro">Authentication</p>
                <form onSubmit={this.handleSubmit}
                      className={(false !== this.state.auth_process ? this.state.auth_process : '')}>
                    <input type="text" placeholder="User"
                           name="user"
                           onChange={this.handleChangeUser}
                           value={this.state.user}/>
                    <input type="password" placeholder="Password"
                           name="password"
                           onChange={this.handleChangePass}
                           value={this.state.pass}/>
                    <button className={className.join(' ')}>Login</button>
                    {this.state.auth_process === 'auth-mismatch' ? <p>invalid credentials</p> : ''}
                    <Pulse/>
                </form>
            </div>
        )
    };
}