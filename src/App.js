import React, { Component } from 'react';
import ReactDOM from "react-dom";
// import logo from './logo.svg';
import './App.css';
import Gun from 'gun/gun';
import GunAuth from './auth/auth.js';
import GunChat from './chat/chat.js';

require('gun/sea');

//URL should be replaced with Unstoppable's GUN Server.
const gun = new Gun('https://www.raygun.live/gun');

class App extends Component {

  constructor(props){
    super(props)
    this.state = {
      user : gun.user(),
    }
  }

  componentDidMount(){
    gun.on('auth', () => {
      document.getElementById('gunAuth').style.display = 'none';
      // document.getElementById('gunChat').style.display = 'flex';
      //document.getElementById('gunPrivateChat').style.display = 'flex';
      ReactDOM.render(<GunChat gun={gun}/>, document.getElementById('chatComponent'));

    })
    gun.user().recall({sessionStorage : true});
    let appContainer = document.querySelector('.gunChatApp');
    appContainer.addEventListener('click', (e) => {
      if(e.target.className != 'leaveChannelBtn' &&
         e.target.className != 'channelMenu'
      ){
        let leaveBtn = document.querySelector('.leaveChannelBtn');
        if(leaveBtn){leaveBtn.remove()}
      }
    })
  }

  render() {
    return (
      <div className="gunChatApp">

        <h1 className="gunChatHeader">Unstoppable Chat!</h1>

        <GunAuth gun={gun} />
        <div id="chatComponent">
        </div>

      </div>
    );
  }

}

export default App;
