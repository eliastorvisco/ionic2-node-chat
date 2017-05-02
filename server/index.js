//Creacio de server socket
var socket = require("socket.io"),
    http = require('http'),
    server = http.createServer(),
    socket = socket.listen(server);
//Server escolta port 7007
server.listen(7007, function() {
    console.log('Server is Running...');
})

//Altres Variables
const color_alphabet = '0123456789ABCDEF';
const uuidV4 = require("uuid/v4");
//Llistes de connexions
//Format Server
var clients = [];
//Format Usuari
var members = [];


//Funcions d'ajuda
function getRandomColor(){
    var color='#';
    for (var i = 0; i < 6; i++) {
        color += color_alphabet[Math.floor(Math.random()*16)];
    }
    return color;
}
function getHMSFormat(date) {
    return '['+date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds()+']';
}
function getClientSocketById(uuid) {
    for(var i=0; i<clients.length; i++)
        if(clients[i].uuid == uuid)
            return clients[i];
    return null;
}



//Listener per l'event de connexio.
socket.on('connection', (clientSocket) => {
    //Declaracio de variables d'usuari
    var userName = false;
    var userColor = false;
    var userId = false;
    var index = false;

    //Listener per l'event de recepcio de missatge al clientsocket
    clientSocket.on('message', function(message) {

        //Tractament de missatges en funcio del tipus

        //Primer missatge enviat per l'usuari. Conte el nom.

        if(message.type == 'user-name') {

            userName = message.data;
            console.log(getHMSFormat(new Date()) + ' ' + userName +
                        ' has joined the chat');

            userColor = getRandomColor();
            userId = uuidV4();

            //Afegim nova connexió a les llistes
            index = clients.push({
                socket: clientSocket,
                uuid: userId
            }) -1;

            members.push({
                name: userName,
                uuid: userId
            });

            //Enviem llista de usuaris connectats al nou usuari
            unicast(clientSocket, {
                type: 'user-params',
                data: {
                    color: userColor,
                    uuid: userId,
                    members: members
                }
            });
            //Indiquem nova connexio als usuaris ja connectats
            broadcast({
                type: 'new-member',
                data: {
                    name: userName,
                    uuid: userId
                }
            })

        //Missatge Normal. S'envia fent broadcast
        } else if(message.type == 'broadcast'){

            broadcast({
                type: 'message',
                data: message.data
            });

        //Missatge tipus Unicast.
        } else if (message.type == 'unicast') {

            var client = getClientSocketById(message.data.uuid);
            if(client!=null){
                //Enviament del missate al receptor dessignat.
                unicast(client.socket, {
                    type: 'message',
                    data: message.data.data
                });
                //Confirmacio d'unicast a l'emissor.
                unicast(clientSocket, {
                    type: 'message',
                    data: message.data.data
                });
            }

        }
    });

    //Events de desconnexio de client
    clientSocket.on('disconnect', (clientSocket) => {

        if(userId != false) {
            console.log((getHMSFormat(new Date()))+ ' ' +  userName + " left the room.");
            //Avis als usuaris de desconnexio d'un usuari
            broadcast({
                type: 'client-disconnected',
                data: members[index]
            });
            //Eliminació del client a les llistes.
            members.splice(index,1);
            clients.splice(index, 1);
        }
    });

    clientSocket.on('close', function(clientSocket){
        if(userId != false) {
            console.log((getHMSFormat(new Date())) + ' ' + userName + " left the room.");
            broadcast({
                type: 'member-disconnected',
                data: members[index]
            });
            members.splice(index,1)
            clients.splice(index, 1);


        }
    });

    //Funcions de retransmissio
    function broadcast(message) {
        for(var i = 0; i < clients.length; i++ )
            clients[i].socket.emit('message', message);
    }

    function unicast(receiver, message) {
        receiver.emit('message', message);
    }
});
