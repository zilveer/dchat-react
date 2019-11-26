import React, { Component } from 'react';
import './invites.css'
import Gun from 'gun/gun';

class ContactInvites extends Component {

  constructor(props){
    super(props);
    this.loadUserContactInvites = this.loadUserContactInvites.bind(this);
  }

  componentDidMount(){
    this.loadUserContactInvites();
  }

  async loadUserContactInvites(){
    let invites = {};
    let gun = this.props.gun;
    let connectToContact = this.props.connectToContact;
    let sendMessageToContact = this.props.sendMessageToContact;

    // RESET USER CHANNEL INVITES
    // gun.get(gun.user()._.sea.pub).get('invites').get('pcontact').put(null)

    let contactInvites = gun.get(gun.user()._.sea.pub).get('invites').get('pcontact');
    contactInvites.on(async function(peerInvites){
      for(let peerPub in peerInvites){
        if(peerPub != '_'){
          contactInvites.get(peerPub).on(async function(contacts){
            for(let contactKey in contacts){
              if(contactKey != '_' && contacts[contactKey]){
                let contact = contacts[contactKey]
                let peerKeys = await gun.user(peerPub).then();
                let peerEpub = peerKeys ? peerKeys.epub : null;
                if(typeof contact == 'string'){
                  contact = JSON.parse(contact)
                  let sec = await Gun.SEA.secret(peerEpub, gun.user()._.sea);
                  contact.pair = await Gun.SEA.decrypt(contact.pair, sec);
                }
                if(!document.getElementById('invite-' + contact.key)){
                  //CREATE CHANNEL INVITE ELEMENT
                  let cInviteEl = document.createElement('div');
                  cInviteEl.className = 'invite';
                  cInviteEl.id = 'invite-' + contact.key;

                  //INVITE CONTENT
                  let inviteContent = document.createElement('div');
                  inviteContent.className = 'inviteContent';
                  cInviteEl.appendChild(inviteContent);

                  //CHANNEL INVITE INFO SECTION (NAME AND NOTIFCATIONS)
                  let newContactInfo = document.createElement('div');
                  newContactInfo.className = 'contactInfo';
                  inviteContent.appendChild(newContactInfo);
                  //CREATE INVITE LABEL
                  let inviteLabel = document.createElement('div');
                  inviteLabel.className = 'inviteLabel';
                  inviteLabel.textContent = "Invited To:";
                  newContactInfo.appendChild(inviteLabel);
                  //CREATE CHANNEL USER COUNT
                  let newContactUserCount = document.createElement('div');
                  newContactUserCount.innerHTML = Object.keys(contact.peers).length - 1 + '&#x1F464;';
                  newContactUserCount.className = 'contactUserCount';
                  newContactInfo.appendChild(newContactUserCount)
                  //CREATE CHANNEL NAME
                  let newContactName = document.createElement('div');
                  newContactName.className = 'contactName';
                  newContactName.textContent = contact.name;
                  newContactInfo.appendChild(newContactName);
                  //CREATE CHANNEL KEY
                  let newContactKey = document.createElement('div');
                  newContactKey.className = 'contactKey';
                  newContactKey.textContent = '#' + contact.key.substr(0,5);
                  newContactInfo.appendChild(newContactKey);

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
                  inviteAccept.textContent = "Join Contact";
                  inviteBtns.appendChild(inviteAccept)

                  //ADD INVITE TO CHANNELS LIST
                  let contactList = document.getElementById('contactsList');
                  contactList.appendChild(cInviteEl);

                  //DENY CHANNEL INVITE
                  inviteDeny.addEventListener('click', async function(){
                    console.log(contact)
                    await contactInvites.get(peerPub).get(contact.key).put(null);
                    cInviteEl.remove();
                  })

                  //ACCEPT CHANNEL INVITE
                  inviteAccept.addEventListener('click', async function(){
                    gun.user().get('pcontact').get(contact.key).get('name').put(contact.name);
                    gun.user().get('pcontact').get(contact.key).get('peers').get(gun.user().is.pub).put({
                      alias : gun.user().is.alias,
                      joined : true
                    });
                    gun.user().get('pcontact').get(contact.key).get('peers').get(peerPub).put({
                      alias : peerKeys.alias,
                      joined : true
                    })
                    let sec = await Gun.SEA.secret(contact.key, gun.user()._.sea);
                    let encPair = await Gun.SEA.encrypt(JSON.stringify(contact.pair), sec);
                    gun.user().get('pcontact').get(contact.key).get('pair').put(encPair);
                    //GET ALL PEERS IN OWNER's CHANNEL
                    let loadedPeers = {};
                    gun.user(peerPub).get('pcontact').get(contact.key).get('peers').once(async function(peers){
                      for(let pubKey in peers){
                        if(typeof peers[pubKey] == 'string' && !loadedPeers[pubKey]){
                          loadedPeers[pubKey] = peers[pubKey];
                          await gun.user().get('pcontact').get(contact.key).get('peers').get(pubKey).put(peers[pubKey]);
                        }
                      }
                      //REMOVE INVITE
                      contactInvites.get(peerPub).get(contact.key).put(null);
                      cInviteEl.remove();
                      //CONNECT TO CHANNEL
                      contact.peers[gun.user().is.pub] = contact.peers[gun.user().is.pub] ? contact.peers[gun.user().is.pub] : {alias : gun.user().is.alias};
                      contact.peers[gun.user().is.pub].joined = true;
                      connectToContact(contact)
                      let joinMsg = gun.user().is.alias + " has joined the chat!";
                      sendMessageToContact(joinMsg, contact, {pubKey : gun.user().is.pub, alias : gun.user().is.alias, action : "join"});
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

export default ContactInvites;
