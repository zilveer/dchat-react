import React, { Component } from 'react';
import Gun from 'gun/gun';
import './chat.css'
import GunContacts from './contacts/contacts.js';

class GunChat extends Component {

  constructor(props) {
    super(props);
    this.connectToPrivatePeer = this.connectToPrivatePeer.bind(this);
    this.sendMessageToPrivatePeer = this.sendMessageToPrivatePeer.bind(this);
    this.connectToChannel = this.connectToChannel.bind(this);
    this.sendMessageToChannel = this.sendMessageToChannel.bind(this);
    this.addMessageToChat = this.addMessageToChat.bind(this);
    this.invitePeerToChannel = this.invitePeerToChannel.bind(this);
    this.joinChannel = this.joinChannel.bind(this);
    this.handleMsgSubmitClick = this.handleMsgSubmitClick.bind(this);
    this.handleInviteClick = this.handleInviteClick.bind(this);
    this.state = {
      userGunChat : null,
      otherPeer : null,
      otherPeerChat : null,
      privateChat : null,
      channelChat : null,
      currentChannel : null,
    }
  }


  async connectToPrivatePeer(username, cb){
    let gun = this.props.gun;

    //RECIEVE PUBKEY OF USER BY ALIAS (Username)
    const peerByAliasData = await gun.get('~@' + username).once();
    if(peerByAliasData){

      const peerPubKey = Object.keys(peerByAliasData)[1].substr(1);
      // gun.user().get('pchat').put(null)
      //SET UP STATE FOR OUR GUN DATA NODES
      this.setState({
        userGunChat : gun.user().get('pchat').get(username),
        otherPeer : gun.user(peerPubKey),
        otherPeerChat : gun.user(peerPubKey).get('pchat').get(gun.user().is.alias),
        privateChat : true,
        channelChat : false,
        currentChannel : null,
      });

      //EMPTY THE MESSAGE LIST
      let msgList = document.getElementById('msgContainerList');
      while (msgList.firstChild) {
        msgList.firstChild.remove();
      }

      //UPDATE CHAT NAVBAR
      let privateMsgNav = document.getElementById('privateMsgNav');
      privateMsgNav.style.display = 'block';
      privateMsgNav.textContent = "Talking with " + username;
      let privateChannelNav = document.getElementById('privateChannelNav');
      privateChannelNav.style.display = 'none';

      const otherPeerKeys = await this.state.otherPeer.then()
      const otherPeerEpub = otherPeerKeys.epub;
      const addMessageToChat = this.addMessageToChat;

      let loadedMsgs = {};
      let thisComp = this;

      async function loadChatOfNode(node){
        node.on((nodeData) => {
          for(let time in nodeData){
            if(!loadedMsgs[time]){
              node.get(time).on(async function(msgData){
                const sec = await Gun.SEA.secret(otherPeerEpub, gun.user()._.sea);
                let decMsg;
                if(typeof msgData.msg == 'object'){
                  decMsg = await Gun.SEA.decrypt(msgData.msg, sec);
                  msgData.msg = decMsg;
                }else{
                  decMsg = msgData.msg;
                }
                loadedMsgs[time] = msgData;
                if(msgData && msgData.msg && msgData.user){
                  if(thisComp.state.otherPeer == gun.user(peerPubKey)){
                    addMessageToChat(msgData);
                  }
                }
              });
            }
          }
        });

      }

      loadChatOfNode(this.state.userGunChat);
      loadChatOfNode(this.state.otherPeerChat);

      if(cb && typeof cb == 'function'){
        cb(peerPubKey)
      };

    }

  }

  async sendMessageToPrivatePeer(msg, channel=null){
    let gun = this.props.gun;
    if(msg.length > 0){
      let msgInput = document.getElementById('msgInput');
      msgInput.value = "";
      msgInput.blur();
      let time = Date.now();
      //ENCRYPT OUR MESSAGE
      const otherPeerKeys = await this.state.otherPeer.then()
      const otherPeerEpub = otherPeerKeys.epub;
      const sec = await Gun.SEA.secret(otherPeerEpub, gun.user()._.sea);
      let encMsg = await Gun.SEA.encrypt(msg, sec);
      this.state.userGunChat.get(time).put({
        msg : encMsg,
        user : gun.user().is.alias,
        time : time,
        channel : JSON.stringify(channel)
      })
    }
  }

  async connectToChannel(channel){
    let gun = this.props.gun;
    let channelKey = channel.key;

    this.setState({
      userGunChat : gun.user().get('pchannel').get(channelKey).get('chat'),
      privateChat : false,
      channelChat : true,
      currentChannel : channel
    })

    //EMPTY THE MESSAGE LIST
    let msgList = document.getElementById('msgContainerList');
    while (msgList.firstChild) {
      msgList.firstChild.remove();
    }
    let loadedMsgs = {};

    //UPDATE CHAT NAVBAR
    let privateChannelNav = document.getElementById('privateChannelNav');
    privateChannelNav.style.display = 'flex';
    let privateChannelNavText = document.getElementById('channelNavText');
    privateChannelNavText.textContent = "Talking with " + channel.name;
    let privateMsgNav = document.getElementById('privateMsgNav');
    privateMsgNav.style.display = 'none';

    const addMessageToChat = this.addMessageToChat;

    let thisComp = this;
    async function loadChatOfNode(node){
      node.on((nodeData) => {
        for(let time in nodeData){
          if(!loadedMsgs[time]){
            node.get(time).on(async function(msgData){
              console.log(msgData.msg)
              const sec = await Gun.SEA.secret(channelKey, gun.user()._.sea);
              let decMsg;
              if(typeof msgData.msg == 'object'){
                decMsg = await Gun.SEA.decrypt(msgData.msg, sec);
                msgData.msg = decMsg;
              }else{
                decMsg = msgData.msg;
              }
              loadedMsgs[time] = msgData;
              if(msgData && msgData.msg && msgData.user && thisComp.state.currentChannel == channel){
                addMessageToChat(msgData);
              }
            });
          }
        }
      });
    }

    //GO through each PEER in this channel
    let loadedPeers = {};
    gun.user().get('pchannel').get(channelKey).get('peers').on((peers) => {
      if(peers){
        for(let pubKey in peers){
          if(!loadedPeers[pubKey]){
            loadedPeers[pubKey] = peers[pubKey];
            let peerChannelChatNode = gun.user(pubKey).get('pchannel').get(channelKey).get('chat');
            loadChatOfNode(peerChannelChatNode);
          }
        }
      }
    })

  }

  async sendMessageToChannel(msg, channel){
    let gun = this.props.gun;
    if(msg.length > 0){
      let msgInput = document.getElementById('msgInput');
      msgInput.value = "";
      msgInput.blur();
      let time = Date.now();
      //ENCRYPT OUR MESSAGE WITH CHANNEL KEY
      // const sec = await Gun.SEA.secret(channel.key, gun.user()._.sea);
      // const encMsg = await Gun.SEA.encrypt(msg, sec);
      this.state.userGunChat.get(time).put({
        msg : msg,
        user : gun.user().is.alias,
        time : time,
      })
    }
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

    if(msg.channel){
      newMsg.className = 'msg channelInvite';
      newMsgText.className = 'channelInviteText';
      let joinChannel = this.joinChannel
      newMsg.addEventListener('click', function(){
        if(typeof msg.channel == 'string'){
          msg.channel = JSON.parse(msg.channel);
        }
        joinChannel(msg.channel);
      })
    }

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

  invitePeerToChannel(alias){
    //Clear invite form
    let gun = this.props.gun;
    let currentChannel = this.state.currentChannel
    document.getElementById('channelInviteInput').value = "";
    this.connectToPrivatePeer(alias, (peerPubKey) => {
      let newMsg = "You are invited to join " + currentChannel.name;
      this.sendMessageToPrivatePeer(newMsg, currentChannel);
      gun.user().get('pchannel').get(currentChannel.key).get('peers').get(peerPubKey).put(alias);
    });
  }

  joinChannel(channel){
    let gun = this.props.gun;
    gun.user().get('pchannel').get(channel.key).get('name').put(channel.name);
    //GET ALL PEERS IN OWNER's CHANNEL
    let loadedPeers = {};
    gun.user(channel.owner).get('pchannel').get(channel.key).get('peers').on((peers) => {
      for(let pubKey in peers){
        if(typeof peers[pubKey] == 'string' && !loadedPeers[pubKey]){
          loadedPeers[pubKey] = peers[pubKey];
          gun.user().get('pchannel').get(channel.key).get('peers').get(pubKey).put(peers[pubKey], () => {
            this.connectToChannel(channel)
          });
        }
      }
    })
  }

  handleMsgSubmitClick(e){
    let msg = document.getElementById('msgInput').value;
    if(this.state.privateChat){
      this.sendMessageToPrivatePeer(msg);
    }
    if(this.state.channelChat){
      this.sendMessageToChannel(msg, this.state.currentChannel)
    }
  }

  handleInviteClick(){
    let alias = document.getElementById('channelInviteInput').value;
    this.invitePeerToChannel(alias)
  }

  render() {
    return (
      <div id="gunChat">

        <GunContacts
         gun={this.props.gun}
         connectToPrivatePeer={this.connectToPrivatePeer}
         sendMessageToPrivatePeer={this.sendMessageToPrivatePeer}
         connectToChannel={this.connectToChannel}
        />

        <div className="chatMessagingContainer">

          <div id="privateChannelNav">
            <div id="channelNavText"></div>
            <form id="channelInviteForm">
              <input id="channelInviteInput" placeholder="Invite a Domain"></input>
              <div id="channelInviteSubmit" onClick={this.handleInviteClick}>Invite</div>
            </form>
          </div>
          <div id="privateMsgNav"></div>

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
