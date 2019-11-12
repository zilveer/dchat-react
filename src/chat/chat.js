import React, { Component } from 'react';
import Gun from 'gun/gun';
import './chat.css'
import GunContacts from './contacts/contacts.js';

class GunChat extends Component {

  constructor(props) {
    super(props);
    this.connectToChat = this.connectToChat.bind(this);
    this.addMessageToChat = this.addMessageToChat.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.handleMsgSubmitClick = this.handleMsgSubmitClick.bind(this);
    this.state = {
      userGunChat : null,
      otherPeer : null,
      otherPeerChat : null
    }
  }

  connectToChat(username){
    let gun = this.props.gun;
    //RECIEVE PUBKEY OF USER BY ALIAS
    gun.get('~@' + username).once((peerData, key) => {
      if(peerData){
        let pubKey = Object.keys(peerData)[1].substr(1);
        //SET UP STATE FOR OUR GUN DATA NODES
        this.setState({
          userGunChat : gun.user().get('pchat').get(username),
          otherPeer : gun.user(pubKey),
          otherPeerChat : gun.user(pubKey).get('pchat').get(gun.user().is.alias)
        });

        //EMPTY THE MESSAGE LIST
        let msgList = document.getElementById('msgContainerList');
        while (msgList.firstChild) {
          msgList.firstChild.remove();
        }
        let loadedMsgs = {};


        this.state.otherPeer.then((u) => {
          //LOAD OUR CHAT DATA
          this.state.userGunChat.on((d) => {
            for(let time in d){
              if(!loadedMsgs[time]){
                this.state.userGunChat.get(time).on((msg) => {
                  Gun.SEA.secret(u.epub, gun.user().pair()).then((sec) => {
                    Gun.SEA.decrypt(msg.msg, sec).then((decMsg) => {
                      msg.msg = decMsg;
                      loadedMsgs[time] = msg;
                      if(msg && msg.msg && msg.user){
                        this.addMessageToChat(msg);
                      }
                    })
                  })
                })
              }
            }
          })

          //LOAD OTHER USER's CHAT DATA
          this.state.otherPeerChat.on((d) => {
            for(let time in d){
              if(!loadedMsgs[time]){
                this.state.otherPeerChat.get(time).on((msg) => {
                  Gun.SEA.secret(u.epub, gun.user().pair()).then((sec) => {
                    Gun.SEA.decrypt(msg.msg, sec).then((decMsg) => {
                      msg.msg = decMsg;
                      loadedMsgs[time] = msg;
                      if(msg && msg.msg && msg.user){
                        this.addMessageToChat(msg);
                      }
                    })
                  })
                })
              }
            }
          })
        })
      }
    })
  }

  addMessageToChat(msg){
    //Don't add message if it already is in the chat
    if(document.getElementById('msg' + msg.time + msg.user)){
      return;
    }
    let newMsg = document.createElement('div');
    newMsg.className = 'msg';
    newMsg.id = "msg" + msg.time + msg.user;
    let newMsgUser = document.createElement('div');
    newMsgUser.className = 'msgUser';
    newMsgUser.textContent = msg.user + ":";
    let newMsgText = document.createElement('div');
    newMsgText.className = 'msgText';
    newMsgText.textContent = msg.msg;
    newMsg.appendChild(newMsgUser);
    newMsg.appendChild(newMsgText);
    newMsg.setAttribute('time', msg.time);

    let msgList = document.getElementById('msgContainerList');
    msgList.appendChild(newMsg);

    //SORT MESSAGES BY TIME
    let sorted = Array.prototype.slice.call(document.querySelectorAll('.msg'), 0).sort(function(a, b) {
      return a.getAttribute('time') - b.getAttribute('time')
    })
    sorted.forEach((msgEl) => {
      msgList.appendChild(msgEl);
    })

    msgList.scrollTo(0, msgList.scrollHeight);
  }

  sendMessage(msg){
    let gun = this.props.gun;
    if(msg.length > 0){
      let msgInput = document.getElementById('msgInput');
      msgInput.value = "";
      msgInput.blur();
      let time = Date.now();
      //ENCRYPT OUR MESSAGE
      this.state.otherPeer.then((u) => {
        Gun.SEA.secret(u.epub, gun.user().pair()).then((sec) => {
          Gun.SEA.encrypt(msg, sec).then((encMsg) => {
            this.state.userGunChat.get(time).put({
              msg : encMsg,
              user : gun.user().is.alias,
              time : time
            })
          })
        })
      })
    }
  }

  handleMsgSubmitClick(e){
    let msg = document.getElementById('msgInput').value;
    this.sendMessage(msg);
  }

  render() {
    return (
      <div id="gunChat">

        <GunContacts gun={this.props.gun} connectToChat={this.connectToChat}/>

        <div className="chatMessagingContainer">
          <div id="msgContainerList"></div>

          <div className="msgInputContainer">
            <input id="msgInput" placeholder="Type a Message"></input>
            <div className="msgInputSubmit">
              <div className="msgInputSubmitLabel" onClick={this.handleMsgSubmitClick}>Send</div>
            </div>
          </div>
        </div>

      </div>
    )
  }
}

export default GunChat;
