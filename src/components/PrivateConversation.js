import React, { Component } from 'react';
import {getPrivateConversation, getUser, sendMessageToPrivateConversation} from "../Api";
import SignOut from "./SignOut";
import MessagesList from "./MessagesList";
import ReactDOM from "react-dom";
import Messenger from "./Messenger";


class PrivateConversation extends Component {
    constructor(props) {
        super(props);

        this.state = {
            messages : [],
            users : [],
            userName : '',
            yourMessage : ''
        };

        this.handleMessageChange = this.handleMessageChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.openMessenger = this.openMessenger.bind(this);

/*        this.socket = new WebSocket("ws://messenger.westeurope.cloudapp.azure.com/socket/messages?token=" + localStorage.getItem('token'));
        this.socket.addEventListener('message', (event) => {
            this.setState({'messages': [JSON.parse(event.data), ...this.state.messages]});
        });*/
    }

    componentDidMount() {
        getUser(this.props.userId)
            .then( response =>
                response.json().then(user => ({user, response}))
            ).then(({user, response}) => {
                if (response.ok) {
                    this.setState({'userName' : user.name});
                } else if (response.status === 401) {
                    console.log("Need authentication");
                } else {
                    console.log(response.statusText);
                }
            }).catch(e => console.log("Error ", e));
        getPrivateConversation(this.props.userId, 0, 100)
            .then( response =>
                response.json().then(messages => ({messages, response}))
            ).then(({messages, response}) => {
            if (response.ok) {
                this.setState({'messages': messages.reverse()});
                /*messages.map( mess => {
                    getUser(mess.user)
                        .then( res =>
                            res.json().then(user => ({user, res}))
                        ).then(({user, res}) => {
                        if (res.ok) {
                            this.setState({'users' : [...this.state.users, user.name]});
                        } else if (res.status === 401) {
                            console.log("Need authentication");
                        } else {
                            console.log(res.statusText);
                        }
                    }).catch(e => console.log("Error ", e));
                });*/
            } else if (response.status === 401) {
                console.log("Need authentication");
            } else {
                console.log(response.statusText);
            }
        }).catch(e => console.log("Error: ", e));
    }

    handleMessageChange(event) {
        this.setState({'yourMessage': event.target.value})
    }

    handleSubmit(event) {
        event.preventDefault();

        sendMessageToPrivateConversation(this.props.userId, this.state.yourMessage)
            .then( response =>
                response.json().then(message => ({message, response}))
            ).then(({message, response}) => {
            if (response.ok) {
                //this.socket.send(JSON.stringify(message));
                this.setState({'messages': [message, ...this.state.messages]});
            } else if (response.status === 401) {
                console.log("Need authentication");
            } else {
                console.log(response.statusText);
            }
        }).catch( e => console.log("Error: ", e));

        document.getElementById('message').value = '';
        document.getElementById('message').focus();
        this.setState({'yourMessage' : ''});
    }

    openMessenger() {
        ReactDOM.render(
            <Messenger />,
            document.getElementById('root')
        );
    }

    render() {
        return (
            <section>
                <SignOut />
                <section>
                    <a float="left" onClick={this.openMessenger}>All conversations</a>
                    <br/>
                    <article>
                    Conversation with {this.state.userName}
                    </article>

                    <form onSubmit={this.handleSubmit}>
                        <p>Your next message: </p>
                        <input id="message" type="text" onChange={this.handleMessageChange} placeholder="" required autoFocus />
                        <br/>
                        <br/>
                        <button type="submit">Send message</button>
                    </form>

                    <MessagesList messages={this.state.messages} users={this.state.users} addNewMessage={this.addNewMessage} socket={this.socket} />
                </section>
            </section>
        );
    }
}

export default PrivateConversation;