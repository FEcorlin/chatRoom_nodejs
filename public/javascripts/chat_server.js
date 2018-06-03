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
    io.set('log level', 10);
    io.sockets.on('connection', function (socket) {//定义每个用户连接的处理逻辑
        gustNumber = assignGuestName(socket, gustNumber, nickNames, namesUsed);
        console.log(socket);
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

function assignGuestName(socket, gustNumber, nickNames, namesUsed) {//分配用户名
    var name = 'Guest' + gustNumber;
    nickNames[socket.id] = name;//把用户昵称和客户端id联系在一起
    socket.emit('nameResult', {
        success: true,
        name: name
    });
    namesUsed.push(name);//存放已占用昵称
    return gustNumber + 1;
};
function joinRoom(socket, room) {//与进入聊天室相关的逻辑
    socket.join(room);//让用户进入房间
    currentRoom[socket.id] = room; //记录用户的当前房间
    socket.emit('joinResult', {room: room});

    //让房间里的 其他用户知 道有新用户 进入了房间
    socket.broadcast.to(room).emit('message', {text: nickNames[socket.id] + 'has joined' + room + '.'});
    var userInRoom = io.sockets.clients(room);//确定有哪些用户 在这个房间里
    if (userInRoom.length > 1) {//如果不止一 个用户在这 个房间里， 汇总下都是 谁
        var userInRoomSummary = 'Users currently in' + room + ':';
        for (var index in userInRoom) {
            var userSocketId = userInRoom[index].id;
            if (userSocketId != socket.id) {
                if (index > 0) {
                    userInRoomSummary += ', ';
                }
            }
            userInRoomSummary += nickNames[userSocketId];
        }
        userInRoomSummary += '.';
        socket.emit('message', {'text': userInRoomSummary});//将房间里其他用户的汇总发送给这个用户
    }
}
function handleNameChangeAttempts(socket, nickNames, namesUsed) {//更改昵称
    socket.on('nameAttempt', function (name) {
        if (name.indexOf('Guest') == 0) {
            socket.emit('nameResult', {success: false, message: "name cant't be with 'Guest'."});
        }
        else {
            if (namesUsed.indexOf(name) == -1) {
                var previousName = nickNames[socket.id];
                var previousNameIndex = namesUsed.indexOf(previousName);
                namesUsed.push(name);
                nickNames[socket.id] = name;
                delete namesUsed[previousNameIndex];
                socket.emit('nameResult', {success: true, name: name});
                socket.broadcast.to(currentRoom[socket.id].emit('message', {
                    text: previousName + 'is now known as ' + name + '.'
                }));
            }
            else {
                socket.emit('nameResult', {
                    success: false,
                    message: 'That name is already used!'
                });
            }
        }
    })
};
function handleMessageBroadcasting(socket) {//转发消息
    console.log(socket);
    socket.on('message', function (message) {
        socket.broadcast.to(message.room).emit('message', {
            text: nickNames[socket.id] + ':' + message.text
        });
    });
}
function handleRoomJoining(socket) {//创建房间
    socket.on('join', function (room) {
        socket.leave(currentRoom[socket.id]);
        joinRoom(socket, room.newRoom);
    })
}
function handleClientDisconnection(socket) {//用户离开房间
    socket.on('disconnect', function () {
        var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
        delete namesUsed[nameIndex];
        delete nickNames[socket.id];
    })
}
  