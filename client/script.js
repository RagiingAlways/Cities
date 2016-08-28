var io = require('socket.io-client');
var global = {};
var socket, reason;
var player = {
	id: -1,
	x: window.innerWidth / 2,
	y: window.innerHeight / 2,
	screenWidth: window.innerWidth,
	screenHeight: window.innerHeight,
	target: {x: window.innerWidth / 2, y: window.innerHeight / 2}
};
global.player = player;

var resources = [];
var workers = [];
var soldiers = [];
var users = [];
var leaderboard = [];
var target = {x: player.x, y: player.y};

$('.nickname').keypress(function(e){
  if(e.which === 13){
    $('.ready').click();
  }
});

$('.ready').click(function(){
  var nick = $('.nickname').val();
  //blank nickname
  if(nick.trim() === ''){
    nick = 'An unnamed city.';
  }

  global.c = document.createElement('canvas');
  window.graph = global.c.getContext('2d');
  $(global.c).attr('id', 'map').attr('width', '1400').attr('height', '1000');
  $('.main').html(global.c);
  $('.main').css('margin', 0);
  //TEMP CODE
  drawgrid();
  //END TEMP CODE
  startGame(nick);
  
  /*graph.fillStyle = '#00EE00';
  graph.fillRect(0, 0, window.innerWidth, window.innerHeight);
  drawgrid();
  drawCircle((window.innerWidth / 2), (window.innerHeight / 2), 40, 5, 240);*/
});

function startGame(name) {
	global.playerName = name.replace(/(<([^>]+)>)/ig, '').substring(0,25);
	
	global.screenWidth = window.innerWidth;
	global.screenHeight = window.innerHeight;
	
	if(!socket) {
		socket = io();
		setUpSocket(socket);
	}
	//if(!global.animLoopHandle) animLoop();
	//socket.emit('respawn');
	global.socket = socket;
}

function setUpSocket(socket) {
	socket.on('connect-failed', function() {
		socket.close();
		global.disconnected = true;
	});
	
	socket.on('disconnect', function() {
		socket.close();
		global.disconnected = true;
	});
	
	socket.on('welcome', function(playerSettings) {
		player = playerSettings;
		player.name = global.playerName;
		player.screenWidth = global.screenWidth;
		player.screenHeight = global.screenHeight;
		//player.target = window.canvas.target;
		global.player = player;
		socket.emit('gotit', player);
		global.gameStart = true;
		global.c.focus();
	});
	
	socket.on('gameSetup', function(data) {
		global.gameWidth = data.gameWidth;
		global.gameHeight = data.gameHeight;
		resize();
	});
	
	socket.on('serverSayMove', function(resourceData, workerData, soldierData, tentData) {
		var playerData;
		for(var i = 0; i < tentData.length; i++) {
			
		}
	});
	
	socket.on('kick', function(reason) {
		alert('You were kicked from the game. reason: ' + reason);
		socket.close();
		global.disconnected = true;
	});
}

function drawCircle(centerX, centerY, radius, sides, hue) {
    var theta = 0;
    var x = 0;
    var y = 0;
    let graph = window.graph;
    graph.lineWidth = 10;
    graph.strokeStyle = 'hsl(' + hue + ', 100%, 40%)';
    graph.fillStyle = 'hsl(' + hue + ', 100%, 50%)';
    
    graph.beginPath();

    for (var i = 0; i < sides; i++) {
        theta = (i / sides) * 2 * Math.PI;
        x = centerX + radius * Math.sin(theta);
        y = centerY + radius * Math.cos(theta);
        graph.lineTo(x, y);
    }

    graph.closePath();
    graph.stroke();
    graph.fill();
}

function drawgrid() {
    let graph = window.graph;
    graph.lineWidth = 1;
    graph.strokeStyle = 130;
    graph.globalAlpha = 0.15;
    graph.beginPath();

    for (var x = -0 - player.x; x < window.innerWidth; x += window.innerHeight / 18) {
        graph.moveTo(x, 0);
        graph.lineTo(x, window.innerHeight);
    }

    for (var y = -0 - player.y ; y < window.innerHeight; y += window.innerHeight / 18) {
        graph.moveTo(0, y);
        graph.lineTo(window.innerWidth, y);
    }

    graph.stroke();
    graph.globalAlpha = 1;
}

function resize() {
	player.screenWidth = c.width = global.screenWidth = global.playerType == 'player' ? window.innerWidth : global.gameWidth;
	player.screenHeight = c.height = global.screenHeight = global.playerType == 'player' ? window.innerHeight : global.gameHeight;
	socket.emit('windowResized', { screenWidth: global.screenWidth, screenHeight: global.screenHeight });
}