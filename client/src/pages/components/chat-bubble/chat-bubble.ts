import { Component, Input } from '@angular/core';
@Component({
    selector:'chat-bubble',
    templateUrl: 'chat-bubble.html',

})
export class ChatBubble {
    @Input() msg: any;

    //Declaracio de variables booleanes per fer estils dinamics
    isUserBubble = false;
    isMemberBroadcast = false;
    isMemberUnicast = false;
    isUserUnicast = false;

    constructor() {}

    ngOnInit() {

        if(this.msg.isUser) {
            this.isUserBubble = true;
            if(this.msg.unicast) this.isUserUnicast = true;
        } else {
            if(this.msg.unicast) this.isMemberUnicast = true;
            else this.isMemberBroadcast = true;
        }
    }
}
