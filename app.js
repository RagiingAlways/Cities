'use strict';
const fs = require('fs');
var express = require('express');
var app = express();
var http = require('http').Server(app);
global.io = require('socket.io')(http);

io.on('connection', function(socket) {

});

app.use(express.static(__dirname + '/client/'));

http.listen(3000, function() {
	console.log('Now listening on port 3000');
});
