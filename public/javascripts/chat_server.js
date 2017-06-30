/**
 * Created by 陈俊 on 2017/6/30.
 */
var socketio = require('socket.io');
var io;
var gustNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

exports.listen = function (server) {
    io = socketio.listen(server);
    io.set('log level', 1);
    io.sockets.on('connection', function (socket) {
        gustNumber = assignGuestName(socket, gustNumber, nickNames, namesUsed);//定义每个用户连接的处理逻辑
        joinRoom(socket, 'Lobby');//在用户连上时，把它放入Lobby聊天室
        handleMessageBroadcasting(socket, nickNames);//处理用户的消息，更名，以及聊天室的创建和变更
        handleNameChangeAttempts(socket, nickNames, namesUsed);
        handleRoomJoining(socket);
        socket.on('rooms', function () {//用户发出请求时，向其提供已经被占用的聊天室列表
            socket.emit('rooms', io.sockets.manager.rooms);
        });
        handleClientDisconnection(socket, nickNames, namesUsed);//定义用户断开连接后的清除逻辑
    });
}

function assignGuestName(socket, gustNumber, nickNames, namesUsed){
    var name = 'gust'+gustNumber;
    nickNames[socket.id] = name;//把用户昵称和客户端id联系在一起
    socket.emit('nameResult',{
        success:true,
        name:name
    });
    namesUsed.push(name);//存放已占用昵称
    return gustNumber + 1;
};
function joinRoom(socket,room){
    socket.join(room);//让用户进入房间

}