var global = require('./global');
var Canvas = require('./canvas');
var socket, reason;
var playerConfig = {
    border: 6,
    textColor: '#FFFFFF',
    textBorder: '#000000',
    textBorderSize: 3,
    defaultSize: 30
};
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
global.target = target;

window.canvas = new Canvas();
var c = window.canvas.cv;
var graph = c.getContext('2d');
$(c).css('opacity', '1')

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

  global.c = document.getElementById('map');
  window.graph = global.c.getContext('2d');
  $('.main').html(global.c);
  //TEMP CODE
  drawgrid();
  //END TEMP CODE
  startGame(nick);

  /*graph.fillStyle = '#00EE00';
  graph.fillRect(0, 0, window.innerWidth, window.innerHeight);
  drawgrid();
  drawCircle((window.innerWidth / 2), (window.innerHeight / 2), 40, 5, 240);*/
  //global.c = document.createElement('canvas');
  //window.graph = global.c.getContext('2d');
  //$(global.c).attr('id', 'map').attr('width', '1400').attr('height', '1000');
  //$('.main').html(global.c);
  $('.main').css('margin', 0);

  startGame(nick);
});

function startGame(name) {
	global.playerName = name.replace(/(<([^>]+)>)/ig, '').substring(0,25);

	global.screenWidth = window.innerWidth;
	global.screenHeight = window.innerHeight;

	if(!socket) {
		socket = io();
		setUpSocket(socket);
	}
	if(!global.animLoopHandle) animLoop();
	socket.emit('respawn');
  window.canvas.socket = socket;
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
		player.target = window.canvas.target;
		global.player = player;
		socket.emit('gotit', player);
		global.gameStart = true;
		c.focus();
	});

	socket.on('gameSetup', function(data) {
		global.gameWidth = data.gameWidth;
		global.gameHeight = data.gameHeight;
		resize();
	});

	socket.on('serverSayMove', function(resourceData, workerData, soldierData, tentData) {
		var playerData;
		for(var i = 0; i < tentData.length; i++) {
      if(typeof(tentData[i].id) == "undefined") {
        playerData = tentData[i];
        break;
      }
		}
    var xoffset = player.x - playerData.x;
    var yoffset = player.y - playerData.y;

    player.x = playerData.x;
    player.y = playerData.y;
    player.hue = playerData.hue;
    player.tents = playerData.tents;
    player.hp = playerData.hp;
    player.maxhp = playerData.maxhp;
    player.stationary = playerData.stationary;
    player.xoffset = isNaN(xoffset) ? 0 : xoffset;
    player.yoffset = isNaN(yoffset) ? 0 : yoffset;

    users = tentData;
    workers = workerData;
    soldiers = soldierData;
    resources = resourceData;
	});

	socket.on('kick', function(reason) {
		alert('You were kicked from the game. reason: ' + reason);
		socket.close();
		global.disconnected = true;
	});
}

window.requestAnimFrame = (function() {
    return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.msRequestAnimationFrame     ||
            function( callback ) {
                window.setTimeout(callback, 1000 / 60);
            };
})();

window.cancelAnimFrame = (function(handle) {
    return  window.cancelAnimationFrame     ||
            window.mozCancelAnimationFrame;
})();

function animloop() {
    global.animLoopHandle = window.requestAnimFrame(animloop);
    gameLoop();
}

function gameLoop() {
    if (global.died) {
        graph.fillStyle = '#333333';
        graph.fillRect(0, 0, global.screenWidth, global.screenHeight);

        graph.textAlign = 'center';
        graph.fillStyle = '#FFFFFF';
        graph.font = 'bold 30px sans-serif';
        graph.fillText('You died!', global.screenWidth / 2, constant.screenHeight / 2);
    }
    else if (!global.disconnected) {
        if (global.gameStart) {
            graph.fillStyle = global.backgroundColor;
            graph.fillRect(0, 0, global.screenWidth, global.screenHeight);

            drawgrid();
            //Not ready for these yet.
            //resources.forEach(drawResources);
            //soldiers.forEach(drawSoldiers);
            //workers.forEach(drawWorkers);

            /*if (global.borderDraw) {
                drawborder();
            }*/
            var orderTents = [];
            for(var i=0; i<users.length; i++) {
                for(var j=0; j<users[i].tents.length; j++) {
                    orderMass.push({
                        nTent: i,
                        nDiv: j,
                        hp: users[i].tents[j].hp
                    });
                }
            }
            orderTents.sort(function(obj1, obj2) {
                return obj1.hp - obj2.hp;
            });

            drawPlayers(orderTents);
            socket.emit('0', window.canvas.target); // playerSendTarget "Heartbeat".

        } else {
            graph.fillStyle = '#333333';
            graph.fillRect(0, 0, global.screenWidth, global.screenHeight);

            graph.textAlign = 'center';
            graph.fillStyle = '#FFFFFF';
            graph.font = 'bold 30px sans-serif';
            graph.fillText('Game Over!', global.screenWidth / 2, global.screenHeight / 2);
        }
    } else {
        graph.fillStyle = '#333333';
        graph.fillRect(0, 0, global.screenWidth, global.screenHeight);

        graph.textAlign = 'center';
        graph.fillStyle = '#FFFFFF';
        graph.font = 'bold 30px sans-serif';
        if (global.kicked) {
            if (reason !== '') {
                graph.fillText('You were kicked for:', global.screenWidth / 2, global.screenHeight / 2 - 20);
                graph.fillText(reason, global.screenWidth / 2, global.screenHeight / 2 + 20);
            }
            else {
                graph.fillText('You were kicked!', global.screenWidth / 2, global.screenHeight / 2);
            }
        }
        else {
              graph.fillText('Disconnected!', global.screenWidth / 2, global.screenHeight / 2);
        }
    }
}

window.addEventListener('resize', resize);

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
		// graph.rotate(20*Math.PI/180);
    graph.stroke();
    graph.globalAlpha = 1;
}

function drawPlayers(order) {
    var start = {
        x: player.x - (global.screenWidth / 2),
        y: player.y - (global.screenHeight / 2)
    };

    for(var z=0; z<order.length; z++)
    {
        var userCurrent = users[order[z].nTent];
        var tentCurrent = users[order[z].nTent].tents[order[z].nDiv];

        var x=0;
        var y=0;

        var points = 30 + ~~(tentCurrent.mass/5);
        var increase = Math.PI * 2 / points;

        graph.strokeStyle = 'hsl(' + userCurrent.hue + ', 100%, 45%)';
        graph.fillStyle = 'hsl(' + userCurrent.hue + ', 100%, 50%)';
        graph.lineWidth = playerConfig.border;

        var xstore = [];
        var ystore = [];

        global.spin += 0.0;

        var circle = {
            x: tentCurrent.x - start.x,
            y: tentCurrent.y - start.y
        };

        for (var i = 0; i < points; i++) {

            x = tentCurrent.radius * Math.cos(global.spin) + circle.x;
            y = tentCurrent.radius * Math.sin(global.spin) + circle.y;
            if(typeof(userCurrent.id) == "undefined") {
                x = valueInRange(-userCurrent.x + global.screenWidth / 2,
                                 global.gameWidth - userCurrent.x + global.screenWidth / 2, x);
                y = valueInRange(-userCurrent.y + global.screenHeight / 2,
                                 global.gameHeight - userCurrent.y + global.screenHeight / 2, y);
            } else {
                x = valueInRange(-tentCurrent.x - player.x + global.screenWidth / 2 + (tentCurrent.radius/3),
                                 global.gameWidth - tentCurrent.x + global.gameWidth - player.x + global.screenWidth / 2 - (tentCurrent.radius/3), x);
                y = valueInRange(-tentCurrent.y - player.y + global.screenHeight / 2 + (tentCurrent.radius/3),
                                 global.gameHeight - tentCurrent.y + global.gameHeight - player.y + global.screenHeight / 2 - (tentCurrent.radius/3) , y);
            }
            global.spin += increase;
            xstore[i] = x;
            ystore[i] = y;
        }
        /*if (wiggle >= player.radius/ 3) inc = -1;
        *if (wiggle <= player.radius / -3) inc = +1;
        *wiggle += inc;
        */
        for (i = 0; i < points; ++i) {
            if (i === 0) {
                graph.beginPath();
                graph.moveTo(xstore[i], ystore[i]);
            } else if (i > 0 && i < points - 1) {
                graph.lineTo(xstore[i], ystore[i]);
            } else {
                graph.lineTo(xstore[i], ystore[i]);
                graph.lineTo(xstore[0], ystore[0]);
            }

        }
        graph.lineJoin = 'round';
        graph.lineCap = 'round';
        graph.fill();
        graph.stroke();
        var nameCell = "";
        if(typeof(userCurrent.id) == "undefined")
            nameCell = player.name;
        else
            nameCell = userCurrent.name;

        var fontSize = Math.max(tentCurrent.radius / 3, 12);
        graph.lineWidth = playerConfig.textBorderSize;
        graph.fillStyle = playerConfig.textColor;
        graph.strokeStyle = playerConfig.textBorder;
        graph.miterLimit = 1;
        graph.lineJoin = 'round';
        graph.textAlign = 'center';
        graph.textBaseline = 'middle';
        graph.font = 'bold ' + fontSize + 'px sans-serif';

        if (global.toggleMassState === 0) {
            graph.strokeText(nameCell, circle.x, circle.y);
            graph.fillText(nameCell, circle.x, circle.y);
        } else {
            graph.strokeText(nameCell, circle.x, circle.y);
            graph.fillText(nameCell, circle.x, circle.y);
            graph.font = 'bold ' + Math.max(fontSize / 3 * 2, 10) + 'px sans-serif';
            if(nameCell.length === 0) fontSize = 0;
            graph.strokeText(Math.round(tentCurrent.mass), circle.x, circle.y+fontSize);
            graph.fillText(Math.round(tentCurrent.mass), circle.x, circle.y+fontSize);
        }
    }
}

function resize() {
	player.screenWidth = c.width = global.screenWidth ? window.innerWidth : global.gameWidth;
	player.screenHeight = c.height = global.screenHeight ? window.innerHeight : global.gameHeight;
	socket.emit('windowResized', { screenWidth: global.screenWidth, screenHeight: global.screenHeight });
	//TEMP CODE
	drawgrid();
	//END TEMP CODE
}
