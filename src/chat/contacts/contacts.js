import React, { Component } from 'react';
import './contacts.css'
import Gun from 'gun/gun';


class GunContacts extends Component {

  constructor(props) {
    super(props);
    this.loadUserContacts = this.loadUserContacts.bind(this);
    this.loadUserChannels = this.loadUserChannels.bind(this);
    this.createContact = this.createContact.bind(this);
    this.createChannel = this.createChannel.bind(this);
    this.handleAddContactClick = this.handleAddContactClick.bind(this);
    this.handleContactClick = this.handleContactClick.bind(this);
    this.handleCreateChannelClick = this.handleCreateChannelClick.bind(this);
    this.state = {
      channels : {},
      contacts : {}
    }
  }

  componentDidMount(){
    let gun = this.props.gun;
    // RESET CHANNELS
    // gun.user().get('pchannel').put(null);

    //LOAD ALL CONTACTS IN SIDEBAR
    this.loadUserContacts();
    //LOAD ALL CHANNELS in Sidebar
    this.loadUserChannels();

  }

  async loadUserContacts(){
    let gun = this.props.gun;
    let connectToPrivatePeer = this.props.connectToPrivatePeer;
    gun.user().get('contacts').on((contacts) => {
      if(contacts){
        for(let peerPub in contacts){
          if(!this.state.contacts[peerPub]){
            gun.user().get('contacts').get(peerPub).get('name').once((alias) => {
              let contactsState = this.state.contacts;
              contactsState[peerPub] = alias;
              this.setState({channels : contactsState})
              //CREATE CONTACT ELEMENT
              let newContactEl = document.createElement('div');
              newContactEl.className = 'contact';
              newContactEl.id = peerPub;
              //CONTACT INFO SECTION (NAME AND NOTIFCATIONS)
              let newContactInfo = document.createElement('div');
              newContactInfo.className = 'contactInfo';
              newContactEl.appendChild(newContactInfo);
              //CONTACT NAME
              let newContactName = document.createElement('div');
              newContactName.className = 'contactName';
              newContactName.textContent = alias;
              newContactInfo.appendChild(newContactName);
              //CONTACT Notifications
              let newContactNotif = document.createElement('div');
              newContactNotif.className = 'contactNotif';
              newContactInfo.appendChild(newContactNotif);
              //CONTACT LATEST MESSAGE
              let newContactLatest = document.createElement('div');
              newContactLatest.className = 'contactLatest';
              newContactInfo.appendChild(newContactLatest);
              //CONTACT MENU
              let newContactMenu = document.createElement('div');
              newContactMenu.className = 'contactMenu';
              newContactMenu.innerHTML = '&#8942;';
              newContactEl.appendChild(newContactMenu)

              let contactList = document.getElementById('contactsList');
              contactList.appendChild(newContactEl);

              newContactEl.addEventListener('click', () => {
                connectToPrivatePeer(alias);
              })

              //LOAD NOTIFCATIONS (UNREAD MESSAGE COUNT)
              gun.get('pchat').get(gun.user().is.alias).get(alias).get('new').on((msgs) => {
                if(msgs){
                  let msgCount = 0;
                  for(let time in msgs){
                    if(time != '_' && msgs[time]){
                      msgCount += 1;
                    }
                  }
                  if(msgCount > 0){
                    newContactNotif.style.display = 'block';
                    newContactNotif.textContent = msgCount
                  }else{
                    newContactNotif.style.display = 'none';
                  }
                }
              })

              //LOAD LATEST MESSAGE
              let latestTime = null;
              gun.get('pchat').get(gun.user().is.alias).get(alias).get('latest').on(async function(msg){
                if(msg && latestTime != msg.time){
                  let msgText = msg.msg;
                  if(typeof msgText == 'string'){
                    msgText = JSON.parse(msgText);
                  }
                  const peerByAliasData = await gun.get('~@' + alias).once();
                  const peerPubKey = Object.keys(peerByAliasData)[1].substr(1);
                  const peerKeys = await gun.user(peerPubKey).then()
                  const peerEpub = peerKeys.epub;
                  const sec = await Gun.SEA.secret(peerEpub, gun.user()._.sea)
                  newContactLatest.textContent = await Gun.SEA.decrypt(msgText, sec);
                  latestTime = msg.time;
                }
              })

            })
          }
        }
      }
    })
  }

  async createContact(contactName){
    document.getElementById('contactsInput').value = "";
    let gun = this.props.gun;
    const peerByAliasData = await gun.get('~@' + contactName).once();
    if(peerByAliasData){
      let peerPub = Object.keys(peerByAliasData)[1].substr(1);
      gun.user().get('contacts').get(peerPub).get('name').put(contactName);
    }
  }

  async loadUserChannels(){
    let gun = this.props.gun;
    let connectToChannel = this.props.connectToChannel;
    let sendMessageToChannel = this.props.sendMessageToChannel;
    gun.user().get('pchannel').on((channels) => {
      if(channels){
        for(let channelKey in channels){
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

                  //LOAD NOTIFCATIONS (UNREAD MESSAGE COUNT)
                  gun.get('pchannel').get(channelKey).get('peers').get(gun.user().is.alias).get('new').on((msgs) => {
                    if(msgs){
                      let msgCount = 0;
                      for(let time in msgs){
                        if(time != '_' && msgs[time]){
                          console.log(time);
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
    //GENERATE A RANDOM KEY FOR THE NEW CHANNEL
    let channelPair = await Gun.SEA.pair()
    let channelKey = channelPair.epub;
    let sec = await Gun.SEA.secret(channelKey, gun.user()._.sea);
    let encPair = await Gun.SEA.encrypt(JSON.stringify(channelPair), sec);
    gun.user().get('pchannel').get(channelKey).get('pair').put(encPair);
    gun.user().get('pchannel').get(channelKey).get('name').put(channelName);
    gun.user().get('pchannel').get(channelKey).get('peers').get(gun.user().is.pub).put(gun.user().is.alias);
  }

  handleContactClick(e){
    let username = e.target.childNodes[0].textContent;
    this.props.connectToPrivatePeer(username);
  }

  handleAddContactClick(){
    let contactsInput = document.getElementById('contactsInput');
    let newContactName = contactsInput.value;
    this.createContact(newContactName);
  }

  handleCreateChannelClick(){
    let channelsInput = document.getElementById('channelsInput')
    let newChannelName = channelsInput.value;
    this.createChannel(newChannelName);
  }

  render() {
    return (
      <div id="gunChatSidebar">

        <div className="gunChatChannels">
          <div className="channelsHeader">Channels</div>
          <div className="channelsInputContainer">
            <input id="channelsInput" placeholder="Create a Channel"></input>
            <div className="channelsInputSubmit" onClick={this.handleCreateChannelClick}>Create</div>
          </div>
          <div id="channelsList">

          </div>
        </div>

        <div className="gunChatContacts">
          <div className="contactsHeader">Contacts</div>
          <div className="contactsInputContainer">
            <input id="contactsInput" placeholder="Add a Domain to Chat"></input>
            <div id="contactsInputSubmit" onClick={this.handleAddContactClick}>Add</div>
          </div>
          <div id="contactsList">
          </div>
        </div>
      </div>
    )
  }
}

export default GunContacts;
