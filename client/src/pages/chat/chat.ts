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
    chat_input:string;
    chats = [];
    myName:string;
    myColor:string;
    myId:string;
    members = [];



  constructor(public navCtrl: NavController, public params:NavParams, public modalCtrl: ModalController) {

        //Recollim el parametre "nom d'usuari", enviat pel login.
        this.myName = params.get("user");

        //Connexió al servidor
        this.socket = io("http://localhost:7007");

        //Listener de l'event de connexio
        this.socket.on('connect', () => {

            console.log((new Date()) + ' Connected to server. Sending Username...');
            this.serverMsg('user-name', this.myName);

            //Listener de l'event de missatge
            this.socket.on('message', (message) => {

                 //Tractament de missatges en funcio del tipus
                 switch(message.type){

                     case 'user-params':
                         this.myColor = message.data.color;
                         this.myId = message.data.uuid;
                         this.members = message.data.members;
                         break;

                    case 'message':
                        this.addMessage(message.data);
                        break;

                    case 'new-member':
                        if(message.data.uuid != this.myId)
                            this.addMember(message.data);
                        break;

                    case 'client-disconnected':
                        this.removeMember(message.data);
                        break;
                 }
             });
        });
    }

    //Enviament de missatge.
    send(msg) {
        //Expressio Regular: "/u <usuari> <missatge>" -> Unicast
        var myRegexp = /(\/u)+\s+((?:[a-zA-Z0-9][a-zA-Z0-9]+))+\s+(.*$)/g;
        //Array contenidor dels grups de match
        var match = myRegexp.exec(msg);

        //Si fem match -> Intentem Unicast a <usuari>
        if(match != null) {
          if(match[3] == "") return;
          var member = this.getMemberByName(match[2]);

          if(member != null) {
              this.unicast(member.uuid, match[3]);
              this.chat_input = "";
          }

        //Si no fem match -> Broadcast
        } else {
          if(msg == "") return;
          this.broadcast(msg);
          this.chat_input = "";
        }
    }

    //Enviament a tot els usuaris
    broadcast(message) {

      this.socket.emit('message', {
          type: 'broadcast',
          data: {
              time: this.formatAMPM(new Date()),
              text: message,
              author: this.myName,
              color: this.myColor,
              uuid: this.myId,
              unicast: false
          }
      });
    }

    //Enviament a un usuari determinat
    unicast(uuid, message) {

      this.socket.emit('message', {
          type: 'unicast',
          data: {
              uuid: uuid,
              data: {
                  time: this.formatAMPM(new Date()),
                  text: message,
                  author: this.myName,
                  ruuid: uuid,
                  color: this.myColor,
                  uuid: this.myId,
                  unicast: true
              }
          }
      });
    }

    //Utilitzat per enviar parametres al Servidor
    serverMsg(command, param) {

      this.socket.emit('message', {
          type: command,
          data: param
      });
    }

    addMember(member) {
      this.members.push(member);
    }

    removeMember(member) {

      var index;

      for(var i = 0; i < this.members.length; i++)
          if(this.members[i].uuid == member.uuid)
              index = i;

      this.members.splice(index, 1);
    }

    getMemberByName(name) {

      for (var i = 0; i < this.members.length; i++)
          if (this.members[i].name == name)
              return this.members[i];

      return null;

    }

    getMemberById(uuid) {

      for (var i = 0; i < this.members.length; i++)
          if (this.members[i].uuid == uuid)
              return this.members[i];

      return null;
    }

    //Afegim missatge a la llista de missatges: chats
    addMessage(message) {

      var authorIsUser = message.uuid == this.myId;
      var receiver = (message.unicast)? this.getMemberById(message.ruuid).name: "broadcast";

      this.chats.push({
          author: message.author,
          isUser: authorIsUser,
          color: message.color,
          text: message.text,
          time: message.time,
          receiver: receiver,
          unicast: message.unicast,
      });
    }

    //Mostrem llista d'usuaris connectats
    showMemberList(){
        let modal = this.modalCtrl.create(MemberList, {data: this.members});
        modal.present();
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
