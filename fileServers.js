/**
 * Created by 陈俊 on 2017/7/25.
 */
var http = require('http');
var parse = require('url').parse;
var join = require('path').join;
var fs = require('fs');

var port = 9000;

var root = __dirname;

var server = http.createServer(function (req,res) {
    var url = parse(req.url);
    var path = join(root,url.pathname);
    var stream = fs.createReadStream(path);
    stream.pipe(res);
    stream.on('error', function (error) {
        res.statusCode(500);
        res.end('Internal Service Error')
    })
    //stream.on('data', function (chunk) {
    //   res.write(chunk);
    //});
    //stream.on('end', function () {
    //    res.end();
    //})
});
server.listen(port);
