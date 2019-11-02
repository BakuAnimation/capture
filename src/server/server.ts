
var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

export interface Offers{
    [id:string]: RTCSessionDescriptionInit
}

const offers: Offers = {}

app.use(express.static('../../dist'));

io.on('connection', function (socket) {
    socket.on('getOffer', function (msg) {
        console.log(this.offers);
        socket.emit('rtcOffer', this.offers[msg]);
    });
    socket.on('rtcAnswer', function (msg) {
        io.to(`${msg.offerer}`).emit('rtcAnswer', msg);
    });
    socket.on('rtcOffer', function (msg){
        this.offers[msg.offerer] = msg.offer;
    })
});

http.listen(3000, function () {
    console.log('listening on *:3000');
});