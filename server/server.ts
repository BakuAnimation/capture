
var express = require('express');
var fs = require('fs');
var app = express();
var historyfallback = require('connect-history-api-fallback');
var https = require('https').createServer({
    key: fs.readFileSync('server/server.key'),
    cert: fs.readFileSync('server/server.cert')
}, app)
var io = require('socket.io')(https);

interface Offers {
    [id: string]: RTCSessionDescriptionInit
}

const offers: Offers = {};
app.use(historyfallback())
app.use(express.static('dist'));

io.on('connection', function (socket: any) {
    socket.on('getOffer', function (msg: string) {
        const key = JSON.parse(msg);
        socket.emit('rtcOffer', offers[key]);
    });
    socket.on('rtcAnswer', function (msg: any) {
        io.to(`${msg.offerer}`).emit('rtcAnswer', msg);
    });
    socket.on('rtcOffer', function (msg: any) {
        offers[msg.offerer] = msg.offer;
    })
});

https.listen(3000, function () {
    console.log('Example app listening on port 3000! Go to https://localhost:3000/')
})