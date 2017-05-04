import { Component } from '@angular/core';
import { NavParams, ViewController} from 'ionic-angular'
@Component({
    selector:'member-list',
    templateUrl: 'member-list.html',

})
export class MemberList {
    members = [];
    unicast:boolean;
    constructor(public params: NavParams, public viewCtrl: ViewController) {
        this.members = params.get('data');
        this.unicast = params.get('unicast');
    }

    dismiss() {
        this.viewCtrl.dismiss();
    }
    memberClick(member) {
        if(this.unicast)
            this.viewCtrl.dismiss(member);
    }
}
