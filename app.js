/**
 * Created by 陈俊 on 2017/6/30.
 */
var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
var cache = {};
var port = 3000;
var chatServer = require('./public/javascripts/chat_server');//载入聊天模块逻辑代码

var server = http.createServer(function (request, response) {
    var filePath = false;
    if (request.url == '/') {//默认html文件
        filePath = 'public/index.html';
    }
    else {
        filePath = 'public' + request.url;
    }
    var absPath = './' + filePath;
    serveStatic(response, cache, absPath);//返回静态文件
});
server.listen(port, function () {
    console.log('server listening on port ' + port);
});
chatServer.listen(server);

function send404(response) {
    response.writeHead(404, {'Content-Type': 'text/plain'});
    response.write('Error 404 : resource not found!');
    response.end();
}
function sendFile(response, filePath, fileContents) {
    response.writeHead(200, {'Content-Type': mime.lookup(path.basename(filePath))});
    response.end(fileContents);
}
function serveStatic(response, cache, absPath) {
    if (cache[absPath]) {
        sendFile(response, absPath, cache[absPath]);//从内存中返回
    }
    else {
        fs.exists(absPath, function (exists) {//检测文件是否存在
            if (exists) {
                fs.readFile(absPath, function (err, data) {//从硬盘中读取文件
                    if (err) {
                        send404(response);
                    }
                    else {
                        cache[absPath] = data;
                        sendFile(response, absPath, data);
                    }
                });
            }
            else {
                send404(response);
            }
        });
    }
}