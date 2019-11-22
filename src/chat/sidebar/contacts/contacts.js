import React, { Component } from 'react';
import './contacts.css'
import Gun from 'gun/gun';

class ChatContacts extends Component {

  constructor(props) {
    super(props);
    this.loadUserContacts = this.loadUserContacts.bind(this);
    this.createContact = this.createContact.bind(this);
    this.handleAddContactClick = this.handleAddContactClick.bind(this);
    this.state = {
      contacts : {}
    }
  }

  componentDidMount(){
    let gun = this.props.gun;
    this.loadUserContacts();
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
                  if(peerKeys){
                    const peerEpub =  peerKeys.epub;
                    const sec = await Gun.SEA.secret(peerEpub, gun.user()._.sea)
                    newContactLatest.textContent = await Gun.SEA.decrypt(msgText, sec);
                    latestTime = msg.time;
                  }
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


  handleContactClick(e){
    let username = e.target.childNodes[0].textContent;
    this.props.connectToPrivatePeer(username);
  }

  handleAddContactClick(){
    let contactsInput = document.getElementById('contactsInput');
    let newContactName = contactsInput.value;
    this.createContact(newContactName);
  }

  render() {
    return (
      <div className="gunChatContacts">
        <div className="contactsHeader">Contacts</div>
        <div className="contactsInputContainer">
          <input id="contactsInput" placeholder="Add a Domain to Chat"></input>
          <div id="contactsInputSubmit" onClick={this.handleAddContactClick}>Add</div>
        </div>
        <div id="contactsList">
        </div>
      </div>
    )
  }
}

export default ChatContacts;
