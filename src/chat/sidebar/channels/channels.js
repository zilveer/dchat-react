import React, { Component } from 'react';
import './channels.css'
import Gun from 'gun/gun';
import ChannelInvites from './invites.js';


class ChatChannels extends Component {

  constructor(props) {
    super(props);
    this.loadUserChannels = this.loadUserChannels.bind(this);
    this.createChannel = this.createChannel.bind(this);
    this.handleCreateChannelClick = this.handleCreateChannelClick.bind(this);
    this.state = {
      channels : {},
    }
  }

  componentDidMount(){
    let gun = this.props.gun;
    // gun.user().get('pchannel').put(null);
    this.loadUserChannels();
  }

  async loadUserChannels(){
    let gun = this.props.gun;
    let connectToChannel = this.props.connectToChannel;
    let sendMessageToChannel = this.props.sendMessageToChannel;
    gun.user().get('pchannel').on((channels) => {
      if(channels){
        for(let channelKey in channels){
          // console.log(channels[channelKey])
          if(channels[channelKey] && !this.state.channels[channelKey]){
            gun.user().get('pchannel').get(channelKey).get('name').once((channelName) => {
              if(channelName){
                let channelsState = this.state.channels;
                channelsState[channelKey] = channelName;
                this.setState({channels : channelsState})

                gun.user().get('pchannel').get(channelKey).get('pair').once(async function(ePair){
                  // console.log("Channel Pair", ePair);
                  if(typeof ePair == 'string'){
                    ePair = JSON.parse(ePair);
                  }
                  let sec = await Gun.SEA.secret(channelKey, gun.user()._.sea);
                  let pair = await Gun.SEA.decrypt(ePair, sec);

                  //CREATE CHANNEL ELEMENT
                  let newChannelEl = document.createElement('div');
                  newChannelEl.className = 'channel';
                  newChannelEl.id = channelKey;
                  //CHANNEL INFO SECTION (NAME AND NOTIFCATIONS)
                  let newChannelInfo = document.createElement('div');
                  newChannelInfo.className = 'channelInfo';
                  newChannelEl.appendChild(newChannelInfo);
                  //CREATE CHANNEL USER COUNT
                  let newChannelUserCount = document.createElement('div');
                  newChannelUserCount.innerHTML = 1 + '&#x1F464;';
                  newChannelUserCount.className = 'channelUserCount';
                  newChannelInfo.appendChild(newChannelUserCount)
                  //CREATE CHANNEL NAME
                  let newChannelName = document.createElement('div');
                  newChannelName.className = 'channelName';
                  newChannelName.textContent = channelName;
                  newChannelInfo.appendChild(newChannelName);
                  //CREATE CHANNEL KEY
                  let newChannelKey = document.createElement('div');
                  newChannelKey.className = 'channelKey';
                  newChannelKey.textContent = '#' + channelKey.substr(0,5);
                  newChannelInfo.appendChild(newChannelKey);
                  //CHANNEL Notifications
                  let newChannelNotif = document.createElement('div');
                  newChannelNotif.className = 'channelNotif';
                  newChannelInfo.appendChild(newChannelNotif);
                  //CHANNEL LATEST MESSAGE
                  let newChannelLatest = document.createElement('div');
                  newChannelLatest.className = 'channelLatest';
                  newChannelInfo.append(newChannelLatest);
                  //CREATE CHANNEL MENU
                  let newChannelMenu = document.createElement('div');
                  newChannelMenu.className = 'channelMenu';
                  newChannelMenu.innerHTML = '&#8942;';
                  newChannelEl.appendChild(newChannelMenu)

                  let channelList = document.getElementById('channelsList');
                  channelList.appendChild(newChannelEl);

                  //CONNECT TO CHANNEL ON CLICK
                  newChannelEl.addEventListener('click', async function(){
                    let peers = await gun.user().get('pchannel').get(channelKey).get('peers').once();
                    connectToChannel({
                      key : channelKey,
                      name : channelName,
                      pair : pair,
                      peers : peers
                    });
                  })
                  //CLICKING ON CHANNEL MENU
                  newChannelMenu.addEventListener('click', () => {
                    if(newChannelMenu.querySelector('.leaveChannelBtn')){
                      newChannelMenu.querySelector('.leaveChannelBtn').remove();
                    }else{
                      let leaveButton = document.createElement('div');
                      leaveButton.className = 'leaveChannelBtn';
                      leaveButton.textContent = "Leave Channel";
                      leaveButton.style.top = newChannelMenu.offsetTop + 5 + 'px';
                      leaveButton.style.left = newChannelMenu.offsetLeft + 30 + 'px';
                      newChannelMenu.appendChild(leaveButton);
                      //LEAVING A CHANNEL
                      leaveButton.addEventListener('click', () => {
                        let channel = {key : channelKey, name : channelName, pair : pair};
                        connectToChannel(channel);
                        let leaveMsg = gun.user().is.alias + " has left the chat.";
                        sendMessageToChannel(leaveMsg, channel, {pubKey : gun.user().is.pub, alias : gun.user().is.alias, action : "leave"});
                        gun.user().get('pchannel').get(channelKey).put(null);
                        newChannelEl.remove();
                      })
                    }
                  })

                  //LOAD USER COUNT
                  let peerCount = 0;
                  let peers = {};
                  gun.user().get('pchannel').get(channelKey).get('peers').map().on((peer) => {
                    if(peer && !peers[peer.alias] && peer.joined){
                      peerCount += 1;
                      peers[peer.alias] = peer;
                      newChannelUserCount.innerHTML = peerCount + '&#x1F464;';
                    }
                  })

                  //LOAD NOTIFCATIONS (UNREAD MESSAGE COUNT)
                  gun.get('pchannel').get(channelKey).get('peers').get(gun.user().is.alias).get('new').on((msgs) => {
                    if(msgs){
                      let msgCount = 0;
                      for(let time in msgs){
                        if(time != '_' && msgs[time]){
                          msgCount += 1;
                        }
                      }
                      if(msgCount > 0){
                        newChannelNotif.style.display = 'block';
                        newChannelNotif.textContent = msgCount
                      }else{
                        newChannelNotif.style.display = 'none';
                      }
                    }
                  })

                  //LOAD LATEST MESSAGE
                  let latestTime = null;
                  gun.get('pchannel').get(channelKey).get('latest').on(async function(msg){
                    if(msg && latestTime != msg.time){
                      let msgText = msg.msg;
                      if(typeof msgText == 'string'){
                        msgText = JSON.parse(msgText);
                      }
                      const sec = await Gun.SEA.secret(channelKey, pair)
                      newChannelLatest.textContent = await Gun.SEA.decrypt(msgText, sec);
                      latestTime = msg.time;
                    }
                  })

                })

              }
            })
          }
        }
      }
    })
  }

  async createChannel(channelName){
    let channelsInput = document.getElementById('channelsInput')
    channelsInput.value = "";
    let gun = this.props.gun;
    //GENERATE A SEA PAIR FOR THE NEW CHANNEL
    let channelPair = await Gun.SEA.pair()
    let channelKey = channelPair.epub;
    let sec = await Gun.SEA.secret(channelKey, gun.user()._.sea);
    let encPair = await Gun.SEA.encrypt(JSON.stringify(channelPair), sec);
    gun.user().get('pchannel').get(channelKey).get('pair').put(encPair);
    gun.user().get('pchannel').get(channelKey).get('name').put(channelName);
    gun.user().get('pchannel').get(channelKey).get('peers').get(gun.user().is.pub).put({
      alias : gun.user().is.alias,
      joined : true
    });
  }

  handleCreateChannelClick(){
    let channelsInput = document.getElementById('channelsInput')
    let newChannelName = channelsInput.value;
    this.createChannel(newChannelName);
  }

  render() {
    return (
      <div className="gunChatChannels">
        <div className="channelsHeader">Channels</div>
        <div className="channelsInputContainer">
          <input id="channelsInput" placeholder="Create a Channel"></input>
          <div className="channelsInputSubmit" onClick={this.handleCreateChannelClick}>Create</div>
        </div>
        <div id="channelsList">

        </div>
        <ChannelInvites
          gun={this.props.gun}
          connectToChannel={this.props.connectToChannel}
          sendMessageToChannel={this.props.sendMessageToChannel}
        />
      </div>
    )
  }


}

export default ChatChannels;
