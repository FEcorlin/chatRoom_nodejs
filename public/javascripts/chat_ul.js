/**
 * Created by 陈俊 on 2017/6/30.
 * Created by 陈俊 on 2017/6/30.
 */
var socket;
try {
    socket = io.connect();
} catch (err) {
    console.log(err);
    alert(err);
}
$(function () {
    var chatApp = new Chat(socket);
    socket.on('nameResult', function (result) {
        if (result.success) {
            message = 'You are now known as' + result.name + '.';
        }
        else {
            message = result.message;
        }
        $('#message').append(divSystemContentElement(message));
    });
    socket.on('joinResult', function (result) {
        $('#room').text(result.room);
        $('#message').append(divSystemContentElement('room changed!'));
    });
    socket.on('message', function (message) {
        var newElement = $('<div></div>').text(message.text);
        $('#message').append(newElement);
    })
    socket.on('rooms', function (rooms) {
        $('#room-list').empty();
        for (var room in rooms) {
            room = room.substring(1, room.length);
            if (room != '') {
                $('#room-list').append(divEscapedContentElement(room));
            }
        }
        $('#room-list div').click(function () {
            chatApp.processCommand('/join ' + $(this).text());
            $('#send-message').focus();
        });
    });
    setInterval(function () {
        socket.emit('rooms');
    }, 1000);
    $('#send-message').focus();
    $('#send-form').submit(function () {
        processUserInput(chatApp, socket);
        return false;
    });
});

function divEscapedContentElement(message) {
    return $('<div></div>').text(message);
}
function divSystemContentElement(message) {
    return $('<div></div>').html('<i>' + message + '</i>');
}
function processUserInput(chatApp, socket) {
    var message = $('#send-message').val();
    var systemMessage;
    if (message.charAt(0) == '/') {
        systemMessage = chatApp.processCommand(message);
        if (systemMessage) {
            $('#message').append(divSystemContentElement(message));
        }
    }
    else {
        chatApp.sendMessage($('#room').text(), message);
        $('#message').append(divEscapedContentElement(message));
        $('#message').scrollTop($('#message').prop('scrollHeight'));
    }
    $('#send-message').val('');
}