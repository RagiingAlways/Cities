'use strict';

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var c = require('./config.json');

var sockets = {};
var users = [];
var resources = [];
var workers = [];
var soldiers = [];

var leaderboard = [];
var leaderboardUpdated = false;

io.on('connection', function(socket) {
	console.log('A user connected.');

	var radius = c.baseRadius;
	var position = c.newPlayerInitPosition == 'random' ? {x: Math.round(Math.random() * c.gameWidth), y: Math.round(Math.random() * c.gameHeight)} : c.newPlayerInitPosition;
	var hp = c.defaulthp, maxhp = c.defaulthp;

	var tents = [{
		radius: c.baseRadius,
		x: position.x,
		y: position.y,
		hp: hp,
		maxhp: maxhp,
	}];

	var level = c.defaultLvl > 0 && c.defaultLvl < 46 ? c.defaultLvl : 1;
	var points = 0; //change this to an equation that issues the correct number if points based on level.

	var currentPlayer = {
		id: socket.id,
		x: position.x,
		y: position.y,
		tents: tents,
		points: points,
		level: level,
		maxhp: maxhp,
		hp: hp,
		hue: Math.round(Math.random() * 360),
		target: {x: 0, y: 0}
	};

	socket.on('gotit', function(player) {
		console.log('[INFO] ' + player.name + ' connecting.');

		if(searchUsers(player.id)) {
			console.log('[INFO] Player ID is already connected, kicking.');
            		socket.disconnect();
		} else if(!validNick(player.name)) {
			socket.emit('kick', 'Invalid username.');
			socket.disconnect();
		} else {
			sockets[player.id] = socket;

			var radius = c.baseRadius;
			var position = c.newPlayerInitPosition == 'random' ? {x: Math.round(Math.random() * c.gameWidth), y: Math.round(Math.random() * c.gameHeight)} : c.newPlayerInitPosition;
			var hp = c.defaulthp, maxhp = c.defaulthp;

			player.x = position.x;
			player.y = position.y;
			player.target.x = 0;
			player.target.y = 0;
			var tents = [{
				radius: c.baseRadius,
				x: position.x,
				y: position.y,
				hp: hp,
				maxhp: maxhp,
			}];

			player.points = 0;
			player.level = c.defaultLvl > 0 ? c.defaultLvl : 1;
			player.hue = Math.round(Math.round() * 360);
			currentPlayer = player;
			users.push(currentPlayer);

			socket.emit('gameSetup', {
				gameWidth: c.gameWidth,
				gameHeight: c.gameHeight
			});
			console.log('Total players: ' + users.length);
		}
	});

	socket.on('windowResized', function (data) {
		currentPlayer.screenWidth = data.screenWidth;
		currentPlayer.screenHeight = data.screenHeight;
	});

	socket.on('respawn', function() {
		if(searchUsers(currentPlayer.id)) {
			users.splice(searchUsers(currentPlayer.id), 1);
		}
		socket.emit('welcome', currentPlayer);
		console.log('[INFO] User ' + (currentPlayer.name == undefined ? '[Not yet named]' : currentPlayer.name)  + ' respawned.');
	});

	socket.on('disconnect', function() {
		if(searchUsers(currentPlayer.id)) {
			users.splice(searchUsers(currentPlayer.id), 1);
		}
		console.log('[INFO] User ' + currentPlayer.name + ' disconnected.');
	});
});

function searchUsers(id) {
	for(let i = 0; i < users.length; i++) {
		if(users[i].id === id) return true;
	}
	return false;
}

function tickPlayer(currentPlayer) {
	//movePlayer(currentPlayer);

	//more to add soon!
}

function moveloop() {
	for(var i = 0; i < users.length; i++) {
		tickPlayer(users[i]);
	}
}

function gameloop() {
	if(users.length > 0) {
		users.sort(function(a, b) { return b.points - a.points; });

		var topUsers = [];

		for(var i = 0; i < Math.min(10, users.length); i++) {
			topUsers.push({
				id: users[i].id,
				name: users[i].name
			});
		}
		if(isNaN(leaderboard) || leaderboard.length !== topUsers.length) {
			leaderboard = topUsers;
			leaderboardUpdated = true;
		} else {
			for(i = 0; i < leaderboard.length; i++) {
				if(leaderboard[i].id !== topUsers[i].id) {
					leaderboard = topUsers;
					leaderboardUpdated = true;
					break;
				}
			}
		}
	}
}

function validNick(nickname) {
    var regex = /^\w*$/;
    return regex.exec(nickname) !== null;
};

function sendUpdates() {
	users.forEach(function(u) {
		//center view if x/y is undefined (for player who died)
		u.x = u.x || c.gameWidth / 2;
		u.y = u.y || c.gameWidth / 2;

		//find visible things
		var visibleResources = resources.map(function(f) {
			if(f.x > u.x - u.screenWidth/2 - f.radius &&
				f.x < u.x + u.screenWidth/2 + f.radius &&
                    		f.y > u.y - u.screenHeight/2 - f.radius &&
                    		f.y < u.y + u.screenHeight/2 + f.radius) {
                    		return f;
			}
		}).filter(function(f) { return f; });

		var visibleWorkers = workers.map(function(f) {
			if(f.x > u.x - u.screenWidth/2 - f.radius - 20 &&
				f.x < u.x + u.screenWidth/2 + f.radius + 20 &&
                    		f.y > u.y - u.screenHeight/2 - f.radius - 20 &&
                    		f.y < u.y + u.screenHeight/2 + f.radius + 20) {
                    		return f;
			}
		}).filter(function(f) { return f; });

		var visibleSoldiers = soldiers.map(function(f) {
			if(f.x > u.x - u.screenWidth/2 - f.radius - 20 &&
				f.x < u.x + u.screenWidth/2 + f.radius + 20 &&
                    		f.y > u.y - u.screenHeight/2 - f.radius - 20 &&
                    		f.y < u.y + u.screenHeight/2 + f.radius + 20) {
                    		return f;
			}
		}).filter(function(f) { return f; });

		var visibleTents = users.map(function(f) {
			for(var z = 0; z < f.tents.length; z++) {
				if(f.tents[z].x + f.tents[z].radius > u.x - u.screenWidth/2 - 20 &&
					f.tents[z].x - f.tents[z].radius < u.x + u.screenWidth/2 + 20 &&
					f.tents[z].y + f.tents[z].radius > u.y - u.screenHeight/2 - 20 &&
					f.tents[z].y - f.tents[z].radius < u.y + u.screenHeight/2 + 20) {
						z = f.tents.length;
						if(f.id !== u.id) {
							return {id: f.id, x: f.x, y: f.y, tents: f.tents, hue: f.hue, name: f.name};
						} else {
							return {x: f.x, y: f.y, tents: f.tents, hue: f.hue};
						}
					}
			}
		}).filter(function(f) { return f; });

		sockets[u.id].emit('serverSayMove', visibleResources, visibleWorkers, visibleSoldiers, visibleTents);
		if(leaderboardUpdated) {
			sockets[u.id].emit('leaderboard', {
				players: users.length,
				leaderboard: leaderboard
			});
		}
	});
	leaderboardUpdated = false;
}

setInterval(moveloop, 1000 / 60);
setInterval(gameloop, 1000);
setInterval(sendUpdates, 1000 / c.networkUpdateFactor);

app.use(express.static(__dirname + '/client'));

var ipaddress = process.env.OPENSHIFT_NODEJS_IP || process.env.IP || '127.0.0.1';
var serverport = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || c.port;
if (process.env.OPENSHIFT_NODEJS_IP !== undefined) {
    http.listen( serverport, ipaddress, function() {
        console.log('Now listening on port ' + serverport);
    });
} else {
    http.listen( serverport, function() {
        console.log('Now listening on port ' + c.port);
    });
}
