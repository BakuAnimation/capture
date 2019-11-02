
var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

interface Offers {
    [id:string]: RTCSessionDescriptionInit
}

const offers: Offers = {};

app.use(express.static('../dist'));

io.on('connection', function (socket: any) {
    socket.on('getOffer', function (msg: any) {
        console.log(offers);
        socket.emit('rtcOffer', offers[msg]);
    });
    socket.on('rtcAnswer', function (msg: any) {
        io.to(`${msg.offerer}`).emit('rtcAnswer', msg);
    });
    socket.on('rtcOffer', function (msg: any){
        offers[msg.offerer] = msg.offer;
    })
});

http.listen(3000, function () {
    console.log('listening on *:3000');
});

httpsServer.listen(8443, function () {
    console.log('listening on *:8443');
});
