import React, { Component } from 'react';
import './contacts.css'

class GunContacts extends Component {

  constructor(props) {
    super(props);
    this.handleContactClick = this.handleContactClick.bind(this);
  }

  componentDidMount(){
    let gun = this.props.gun;
  }

  handleContactClick(e){
    let username = e.target.childNodes[0].textContent;
    this.props.connectToChat(username);
  }

  render() {
    return (
      <div id="gunContacts">
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
    )
  }
}

export default GunContacts;
