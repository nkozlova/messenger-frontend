import React, { Component } from 'react';
import {getPrivateConversation, getPublicConversation, getUser, sendMessageToPrivateConversation, sendMessageToPublicConversation} from "../Api";
import SignOut from "./SignOut";
import MessagesList from "./MessagesList";
import ReactDOM from "react-dom";
import Messenger from "./Messenger";


class Conversation extends Component {
    constructor(props) {
        super(props);

        this.state = {
            messages : [],
            users : [],
            userName : '',
            yourMessage : '',

            lastWasPublic : false
        };

        this.handleMessageChange = this.handleMessageChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.openMessenger = this.openMessenger.bind(this);
        this.addNewMessage = this.addNewMessage.bind(this);
        this.loadAllData = this.loadAllData.bind(this);

        this.props.socket.addEventListener("message", (event) => {
            this.addNewMessage(JSON.parse(event.data));
        });
    }

    componentDidMount() {
        this.loadAllData();
    }

    handleMessageChange(event) {
        this.setState({'yourMessage': event.target.value})
    }

    handleSubmit(event) {
        event.preventDefault();

        if (this.props.isPublic) {
            sendMessageToPublicConversation(this.state.yourMessage)
                .then( response =>
                    response.json().then(message => ({message, response}))
                ).then(({message, response}) => {
                if (response.ok) {
                    this.props.socket.send(JSON.stringify(message));
                } else if (response.status === 401) {
                    console.log("Need authentication");
                } else {
                    console.log(response.statusText);
                }
            }).catch( e => console.log("Error: ", e));
        } else {
            sendMessageToPrivateConversation(this.props.userId, this.state.yourMessage)
                .then(response =>
                    response.json().then(message => ({message, response}))
                ).then(({message, response}) => {
                if (response.ok) {
                    this.props.socket.send(JSON.stringify(message));
                } else if (response.status === 401) {
                    console.log("Need authentication");
                } else {
                    console.log(response.statusText);
                }
            }).catch(e => console.log("Error: ", e));
        }

        document.getElementById('message').value = '';
        document.getElementById('message').focus();
        this.setState({'yourMessage' : ''});
    }

    addNewMessage(message) {
        let id = message.id;
        let userId = message.user;
        if (id === undefined) {
            id = message.Id;
            userId = message.User;
        }

        if (this.state.messages.find(function(mess) {return mess.id === id;}) === undefined) {
            this.setState({'messages': [message, ...this.state.messages]});
            getUser(userId)
                .then(response =>
                    response.json().then(user => ({user, response}))
                ).then(({user, response}) => {
                    if (response.ok) {
                        let name = response.ok ? user.name : "Some Person";
                        this.setState({'users' : [name, ...this.state.users]});
                    }
                });
        }
    }

    openMessenger() {
        ReactDOM.render(
            <Messenger />,
            document.getElementById('root')
        );
    }

    componentDidUpdate(nextProps, nextState, nextContext) {
        if (this.props.isPublic !== this.state.lastWasPublic) {
            this.loadAllData();
        }
    }

    loadAllData() {
        this.setState({'lastWasPublic' : this.props.isPublic});

        if (this.props.isPublic) {
            getPublicConversation(0, 200)
                .then( response =>
                    response.json().then(messages => ({messages, response}))
                ).then(({messages, response}) => {
                if (response.ok) {
                    this.setState({'messages': messages.reverse(), 'users': Array(messages.length)});
                    messages.forEach((message, i) => {
                        getUser(message.user)
                            .then(response =>
                                response.json().then(user => ({user, response}))
                            ).then(({user, response}) => {
                                let users = this.state.users;
                                users[i] = response.ok ? user.name : "Some Person";
                                this.setState({'users' : users});
                            });
                        });
                } else if (response.status === 401) {
                    console.log("Need authentication");
                } else {
                    console.log(response.statusText);
                }
            }).catch(e => console.log("Error: ", e));
        } else {
            getUser(this.props.userId)
                .then(response =>
                    response.json().then(user => ({user, response}))
                ).then(({user, response}) => {
                if (response.ok) {
                    this.setState({'userName': user.name});
                } else if (response.status === 401) {
                    console.log("Need authentication");
                } else {
                    console.log(response.statusText);
                }
            }).catch(e => console.log("Error ", e));

            getPrivateConversation(this.props.userId, 0, 200)
                .then(response =>
                    response.json().then(messages => ({messages, response}))
                ).then(({messages, response}) => {
                if (response.ok) {
                    this.setState({'messages': messages.reverse(), 'users': Array(messages.length)});
                    messages.forEach((message, i) => {
                        getUser(message.user)
                            .then(response =>
                                response.json().then(user => ({user, response}))
                            ).then(({user, response}) => {
                                let users = this.state.users;
                                users[i] = response.ok ? user.name : "Some Person";
                                this.setState({'users' : users});
                            });
                        });
                } else if (response.status === 401) {
                    console.log("Need authentication");
                } else {
                    console.log(response.statusText);
                }
            }).catch(e => console.log("Error: ", e));
        }
    }

    render() {
        let topic = this.props.isPublic ? "Public conversation" : "Conversation with " + this.state.userName;
        return (
            <section>
                <SignOut />
                <section>
                    <b onClick={this.openMessenger}>All conversations</b>
                    <br/>
                    <article>{topic}</article>

                    <form onSubmit={this.handleSubmit}>
                        <p>Your next message: </p>
                        <input id="message" type="text" onChange={this.handleMessageChange} placeholder="" required autoFocus />
                        <br/>
                        <br/>
                        <button type="submit">Send message</button>
                    </form>

                    <MessagesList messages={this.state.messages} users={this.state.users} socket={this.props.socket}/>
                </section>
            </section>
        );
    }
}

export default Conversation;