import React, { Component } from 'react';
import './auth.css'

class GunAuth extends Component {

  constructor(props) {
    super(props);
    this.loginWithGun = this.loginWithGun.bind(this);
    this.registerWithGun = this.registerWithGun.bind(this);
  }

  loginWithGun(){
    let username = document.getElementById('usernameInput').value;
    let password = document.getElementById('passwordInput').value;
    let gun = this.props.gun;
    gun.user().auth(username, password);
  }

  registerWithGun(){
    let username = document.getElementById('usernameInput').value;
    let password = document.getElementById('passwordInput').value;
    let gun = this.props.gun;
    gun.user().create(username, password);
  }

  render() {
    return (
      <div id="gunAuth">

        <h2 className="gunAuthHeader">Join the Chat!</h2>
        <input id="usernameInput" placeholder="Your Domain"></input>
        <input id="passwordInput" type="password" placeholder="Password"></input>
        <div className="gunAuthLogin" onClick={this.loginWithGun}>Log In</div>
        <div className="gunAuthRegister" onClick={this.registerWithGun}>Register</div>

      </div>
    )
  }
}

export default GunAuth;
