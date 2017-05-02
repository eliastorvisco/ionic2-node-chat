import { Component} from '@angular/core';
import { NavController } from 'ionic-angular';
import { ChatPage } from '../chat/chat';


@Component({
  selector: 'page-login',
  templateUrl: 'login.html'
})
export class LoginPage {

    constructor(public navCtrl: NavController) {}

    connect(myName){
        this.navCtrl.push(ChatPage, {user: myName});
    }



}
