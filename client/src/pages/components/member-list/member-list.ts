import { Component } from '@angular/core';
import { NavParams, ViewController} from 'ionic-angular'
@Component({
    selector:'member-list',
    templateUrl: 'member-list.html',

})
export class MemberList {
    members = [];
    constructor(public params: NavParams, public viewCtrl: ViewController) {
        this.members = params.get('data');
    }

    dismiss() {
        this.viewCtrl.dismiss();
    }
}
