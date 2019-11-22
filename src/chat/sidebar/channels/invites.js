import React, { Component } from 'react';
import './invites.css'
import Gun from 'gun/gun';

class ChannelInvites extends Component {

  constructor(props){
    super(props);
    this.loadUserChannelInvites = this.loadUserChannelInvites.bind(this);
  }

  componentDidMount(){
    this.loadUserChannelInvites();
  }

  async loadUserChannelInvites(){
    let invites = {};
    let gun = this.props.gun;
    let connectToChannel = this.props.connectToChannel;
    let sendMessageToChannel = this.props.sendMessageToChannel;

    // RESET USER CHANNEL INVITES
    // gun.get(gun.user()._.sea.pub).get('invites').get('pchannel').put(null)

    let channelInvites = gun.get(gun.user()._.sea.pub).get('invites').get('pchannel');
    channelInvites.on(async function(peerInvites){
      for(let peerPub in peerInvites){
        if(peerPub != '_'){
          channelInvites.get(peerPub).on(async function(channels){
            for(let channelKey in channels){
              if(channelKey != '_' && channels[channelKey]){
                let channel = channels[channelKey];
                let peerKeys = await gun.user(peerPub).then();
                let peerEpub = peerKeys ? peerKeys.epub : null;
                if(typeof channel == 'string'){
                  channel = JSON.parse(channel)
                  let sec = await Gun.SEA.secret(peerEpub, gun.user()._.sea);
                  channel.pair = await Gun.SEA.decrypt(channel.pair, sec);
                }
                if(!document.getElementById(channel.key)){
                  //CREATE CHANNEL INVITE ELEMENT
                  let cInviteEl = document.createElement('div');
                  cInviteEl.className = 'invite';
                  cInviteEl.id = channel.key;

                  //INVITE CONTENT
                  let inviteContent = document.createElement('div');
                  inviteContent.className = 'inviteContent';
                  cInviteEl.appendChild(inviteContent);

                  //CHANNEL INVITE INFO SECTION (NAME AND NOTIFCATIONS)
                  let newChannelInfo = document.createElement('div');
                  newChannelInfo.className = 'channelInfo';
                  inviteContent.appendChild(newChannelInfo);
                  //CREATE INVITE LABEL
                  let inviteLabel = document.createElement('div');
                  inviteLabel.className = 'inviteLabel';
                  inviteLabel.textContent = "Invited To:";
                  newChannelInfo.appendChild(inviteLabel);
                  //CREATE CHANNEL USER COUNT
                  let newChannelUserCount = document.createElement('div');
                  newChannelUserCount.innerHTML = Object.keys(channel.peers).length - 1 + '&#x1F464;';
                  newChannelUserCount.className = 'channelUserCount';
                  newChannelInfo.appendChild(newChannelUserCount)
                  //CREATE CHANNEL NAME
                  let newChannelName = document.createElement('div');
                  newChannelName.className = 'channelName';
                  newChannelName.textContent = channel.name;
                  newChannelInfo.appendChild(newChannelName);
                  //CREATE CHANNEL KEY
                  let newChannelKey = document.createElement('div');
                  newChannelKey.className = 'channelKey';
                  newChannelKey.textContent = '#' + channel.key.substr(0,5);
                  newChannelInfo.appendChild(newChannelKey);

                  //INVITE BUTTONS
                  let inviteBtns = document.createElement('div');
                  inviteBtns.className = 'inviteBtns'
                  cInviteEl.appendChild(inviteBtns);

                  //INVITE DENY BTN
                  let inviteDeny = document.createElement('inviteDeny');
                  inviteDeny.className = 'inviteDeny';
                  inviteDeny.textContent = "Don't Join";
                  inviteBtns.appendChild(inviteDeny)

                  //INVITE ACCEPT BTN
                  let inviteAccept = document.createElement('inviteAccept');
                  inviteAccept.className = 'inviteAccept';
                  inviteAccept.textContent = "Join Channel";
                  inviteBtns.appendChild(inviteAccept)

                  //ADD INVITE TO CHANNELS LIST
                  let channelList = document.getElementById('channelsList');
                  channelList.appendChild(cInviteEl);

                  //DENY CHANNEL INVITE
                  inviteDeny.addEventListener('click', () => {
                    channelInvites.get(peerPub).get(channel.key).put(null);
                    cInviteEl.remove();
                  })

                  //ACCEPT CHANNEL INVITE
                  inviteAccept.addEventListener('click', async function(){
                    gun.user().get('pchannel').get(channel.key).get('name').put(channel.name);
                    gun.user().get('pchannel').get(channel.key).get('peers').get(gun.user().is.pub).put(gun.user().is.alias);
                    let sec = await Gun.SEA.secret(channel.key, gun.user()._.sea);
                    let encPair = await Gun.SEA.encrypt(JSON.stringify(channel.pair), sec);
                    gun.user().get('pchannel').get(channel.key).get('pair').put(encPair);
                    //GET ALL PEERS IN OWNER's CHANNEL
                    let loadedPeers = {};
                    gun.user(peerPub).get('pchannel').get(channel.key).get('peers').once(async function(peers){
                      for(let pubKey in peers){
                        if(typeof peers[pubKey] == 'string' && !loadedPeers[pubKey]){
                          loadedPeers[pubKey] = peers[pubKey];
                          await gun.user().get('pchannel').get(channel.key).get('peers').get(pubKey).put(peers[pubKey]);
                        }
                      }
                      //REMOVE INVITE
                      channelInvites.get(peerPub).get(channel.key).put(null);
                      cInviteEl.remove();
                      //CONNECT TO CHANNEL
                      connectToChannel(channel)
                      let joinMsg = gun.user().is.alias + " has joined the chat!";
                      sendMessageToChannel(joinMsg, channel, {pubKey : gun.user().is.pub, alias : gun.user().is.alias, action : "join"});
                    })
                  })
                }

              }
            }
          })
        }
      }
    })
  }

  render(){
    return null;
  }

}

export default ChannelInvites;
