import React, { Component } from 'react';
import './sidebar.css'
import Gun from 'gun/gun';
import ChatChannels from './channels/channels.js';
import ChatContacts from './contacts/contacts.js';

class ChatSidebar extends Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div id="gunChatSidebar">

        <ChatChannels
         gun={this.props.gun}
         connectToChannel={this.props.connectToChannel}
         sendMessageToChannel={this.props.sendMessageToChannel}
        />
        <ChatContacts
         gun={this.props.gun}
         connectToPrivatePeer={this.props.connectToPrivatePeer}
         sendMessageToPrivatePeer={this.props.sendMessageToPrivatePeer}
        />

      </div>
    )
  }
}

export default ChatSidebar;
