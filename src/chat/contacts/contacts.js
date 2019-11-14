import React, { Component } from 'react';
import './contacts.css'
import Gun from 'gun/gun';


class GunContacts extends Component {

  constructor(props) {
    super(props);
    this.handleContactClick = this.handleContactClick.bind(this);
    this.handleCreateChannelClick = this.handleCreateChannelClick.bind(this);
    this.state = {
      channels : {},
      contacts : {}
    }
  }

  componentDidMount(){
    let gun = this.props.gun;
    //LOAD ALL CHANNELS in Sidebar
    // gun.user().get('pchannel').put(null);
    let connectToChannel = this.props.connectToChannel;
    gun.user().get('pchannel').on((channels) => {
      if(channels){
        for(let channelKey in channels){
          if(!this.state.channels[channelKey]){
            gun.user().get('pchannel').get(channelKey).get('name').once((channelName) => {
              let channelsState = this.state.channels;
              channelsState[channelKey] = channelName;
              this.setState({channels : channelsState})
              let newChannelEl = document.createElement('div');
              newChannelEl.className = 'channel';
              newChannelEl.id = channelKey;
              let newChannelName = document.createElement('div');
              newChannelName.className = 'channelName';
              newChannelName.textContent = channelName;
              newChannelEl.appendChild(newChannelName);
              let channelList = document.getElementById('channelsList');
              channelList.appendChild(newChannelEl);
              newChannelEl.addEventListener('click', () => {
                connectToChannel({key : channelKey, name : channelName});
              })
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
    gun.user().get('pchannel').get(channelKey).get('name').put(channelName);
    gun.user().get('pchannel').get(channelKey).get('peers').get(gun.user().is.pub).put(gun.user().is.alias);
  }

  handleContactClick(e){
    let username = e.target.childNodes[0].textContent;
    this.props.connectToPrivatePeer(username);
  }

  // handleChannelClick(e){
  //   let channelKey = e.target.id;
  //   this.props.connectToChannel(channelKey);
  // }

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
            <input className="contactsInput" placeholder="Add a Domain to Chat"></input>
            <div className="contactsInputSubmit">Add</div>
          </div>
          <div className="contactsList">
            <div className="contact" onClick={this.handleContactClick}>
              <div className="contactName">jamie.crypto</div>
            </div>
            <div className="contact" onClick={this.handleContactClick}>
              <div className="contactName">braden.crypto</div>
            </div>
            <div className="contact" onClick={this.handleContactClick}>
              <div className="contactName">ryan.crypto</div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default GunContacts;
