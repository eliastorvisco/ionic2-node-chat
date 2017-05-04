import { Component, ViewChild, AfterViewChecked, ElementRef, OnInit} from '@angular/core';
import { NavController, NavParams, ModalController} from 'ionic-angular';
import * as io from 'socket.io-client';
import { MemberList } from '../components/member-list/member-list';
import { TSMap } from "typescript-map"

@Component({
  selector: 'page-chat',
  templateUrl: 'chat.html',
})

export class ChatPage  implements OnInit, AfterViewChecked {

    @ViewChild('scrollMe') private myScrollContainer: ElementRef;

    //Actualitzacio del scroll de la llista de missatges
    ngOnInit() {
        this.scrollToBottom();
    }
    ngAfterViewChecked() {
        this.scrollToBottom();
    }
    scrollToBottom(): void {
        try{
            this.myScrollContainer.nativeElement.scrollTop =
                this.myScrollContainer.nativeElement.scrollHeight;
        } catch (err){}
    }

    //Declaracio de variables d'usuari
    socket:any;
    input:string;
    messages = [];
    user:any;
    members = [];




    constructor(public navCtrl: NavController, public params:NavParams, public modalCtrl: ModalController) {

        //Recollim el parametre "nom d'usuari", enviat pel login.
        var name = params.get("user");

        //Connexió al servidor
        this.socket = io("http://localhost:7007");

        //Listener de l'event de connexio
        this.socket.on('connect', () => {

            console.log((new Date()) + ' Connected to server. Sending Username...');
            this.msgServer('user-name', name);

            //Listener de l'event de missatge
            this.socket.on('message', (message) => {

                 //Tractament de missatges en funcio del tipus
                 switch(message.type){

                     case 'user-params':
                        this.user = message.data.user;
                        this.members = message.data.members;
                        break;

                    case 'message':
                        this.addMessage(message.data);
                        break;

                    case 'new-member':
                        let newMember = message.data;
                        if(newMember.uuid != this.user.uuid)
                            this.members.push(newMember);
                        break;

                    case 'client-disconnected':
                        this.removeMember(message.data);
                        break;
                 }
             });
        });
    }

    //Enviament de missatge.
    send(text) {
        //Expressio Regular: "/u <usuari> <missatge>" -> Unicast
        var myRegexp = /(\/u)+\s+((?:[a-zA-Z0-9][a-zA-Z0-9]+))+\s+(.*$)/g;
        //Array contenidor dels grups de match
        var match = myRegexp.exec(text);
        //Si fem match -> Intentem Unicast a <usuari>
        if(match != null) {

            var name = match[2];
            var message = match[3];

            if(message == "") return;
            var nameMatch = this.getMemberByName(name);

            if(nameMatch.length > 1)
                this.selectUnicast(nameMatch, message);

            else if (nameMatch.length = 1) {
                var member = nameMatch[0];
              if(member != null)
                this.unicast(member, message);
          }

        //Si no fem match -> Broadcast
        } else {
          if(text == "") return;
          this.broadcast(text);
        }
        this.input = "";
    }



    //Enviament a tot els usuaris
    broadcast(message) {
        console.log(this.user);
      this.socket.emit('message', {
          type: 'broadcast',
          data: {
              time: this.formatAMPM(new Date()),
              text: message,
              author: this.user,
              receiver: 'broadcast',
              unicast: false
          }
      });
    }

    //Enviament a un usuari determinat
    unicast(member, message) {

      this.socket.emit('message', {
          type: 'unicast',
          data: {
              time: this.formatAMPM(new Date()),
              text: message,
              author: this.user,
              receiver: member,
              unicast: true
          }
      });
    }

    //Utilitzat per enviar parametres al Servidor
    msgServer(command, param) {

      this.socket.emit('message', {
          type: command,
          data: param
      });
    }



    //Afegim missatge a la llista de missatges: messages
    addMessage(message) {
        console.log(message);
      var authorIsUser = message.author.uuid == this.user.uuid;
      var receiver = (message.unicast)? message.receiver: {name: 'broadcast'};

      this.messages.push({
          author: message.author,
          isUser: authorIsUser,
          text: message.text,
          time: message.time,
          receiver: receiver,
          unicast: message.unicast,
      });
    }

    //Mostrem llista d'usuaris connectats
    showMemberList(){

        let modal = this.modalCtrl.create(MemberList, {data: this.members, unicast: false});
        modal.present();
    }

    selectUnicast(members, message){
        let modal = this.modalCtrl.create(MemberList, {data: members, unicast: true});
        modal.onDidDismiss(member => {

            if(member != null) {

                this.unicast(member, message);
            }
        });
        modal.present();
    }

    removeMember(exmember) {
        var index;
      for(var i = 0; i < this.members.length; i++)
          if(this.members[i].uuid == exmember.uuid)
              index = i;

      this.members.splice(index, 1);
    }

    getMemberByName(name) {
        var nameMatch = [];
        for (var i = 0; i < this.members.length; i++)
            if (this.members[i].name == name && this.members[i].uuid != this.user.uuid)
                nameMatch.push(this.members[i]);

        return nameMatch;
    }

    getMemberById(uuid) {

      for (var i = 0; i < this.members.length; i++)
          if (this.members[i].uuid == uuid)
              return this.members[i];

      return null;
    }

    formatAMPM(date) {
        console.log(date);
      var hours = date.getHours();
      var minutes = date.getMinutes();
      var ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      minutes = minutes < 10 ? '0'+minutes : minutes;
      var strTime = hours + ':' + minutes + ' ' + ampm;
      return strTime;
    }
}
