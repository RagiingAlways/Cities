class Canvas {
    constructor(params) {
        this.directionLock = false;
        this.target = global.target;
        this.velo = global.velo;
        this.reenviar = true;
        this.socket = global.socket;
        this.directions = [];
        var self = this;

        this.cv = document.getElementById('map');
        this.cv.width = global.screenWidth;
        this.cv.height = global.screenHeight;
        //this.cv.addEventListener('mousemove', this.gameInput, false);
        //this.cv.addEventListener('mouseout', this.outOfBounds, false);
        this.cv.addEventListener('keypress', this.keyInput, false);
        this.cv.addEventListener('keyup', function(event) {
            self.reenviar = true;
            self.directionUp(event);
        }, false);
        this.cv.addEventListener('keydown', this.directionDown, false);
        this.cv.addEventListener('touchstart', this.touchInput, false);
        this.cv.addEventListener('touchmove', this.touchInput, false);
        this.cv.parent = self;
        global.canvas = this;
    }

    // Function called when a key is pressed, will change direction if arrow key.
    directionDown(event) {
    	var key = event.which || event.keyCode;
        var self = this.parent; // have to do this so we are not using the cv object
    	if (self.directional(key)) {
    		self.directionLock = true;
    		//if (self.newDirection(key, self.directions, true)) {
        self.newDirection(key, self.directions, true)
    			self.updateTarget(self.directions);
    			self.socket.emit('0', self.target, self.velo);
    		//}
    	}
    }

    // Function called when a key is lifted, will change direction if arrow key.
    directionUp(event) {
    	var key = event.which || event.keyCode;
    	if (this.directional(key)) { // this == the actual class
    		//if (this.newDirection(key, this.directions, false)) {
        this.newDirection(key, this.directions, false)
    			this.updateTarget(this.directions);
    			if (this.directions.length === 0) this.directionLock = false;
    			this.socket.emit('0', this.target, this.velo);
    		//}
    	}
    }

    // Updates the direction array including information about the new direction.
    newDirection(direction, list, isAddition) {
    	var result = false;
    	var found = false;
    	for (var i = 0, len = list.length; i < len; i++) {
    		if (list[i] == direction) {
    			found = true;
    			if (!isAddition) {
    				result = true;
    				// Removes the direction.
    				list.splice(i, 1);
    			}
    			break;
    		}
    	}
    	// Adds the direction.
    	if (isAddition && found === false) {
    		result = true;
    		list.push(direction);
    	}

    	return result;
    }

    // Updates the target according to the directions in the directions array.
    updateTarget(list) {
      this.target = { x : 0, y: 0 };
      for (var i = 0, len = list.length; i < len; i++) {
    	  if (list[i] == global.KEY_LEFT || list[i] == global.KEY_LEFT_ALT) {
	        if(this.velo.x > -global.player.speed) this.velo.x--;
        }
        if (list[i] == global.KEY_RIGHT || list[i] == global.KEY_RIGHT_ALT) {
          if(this.velo.x < global.player.speed) this.velo.x++;
        }
        if (list[i] == global.KEY_UP || list[i] == global.KEY_UP_ALT) {
          if(this.velo.y > -global.player.speed) this.velo.y--;
        }
        if (list[i] == global.KEY_DOWN || list[i] == global.KEY_DOWN_ALT) {
          if(this.velo.y < global.player.speed) this.velo.y++;
        }
      }
      //Apply friction
      this.velo.y *= global.friction;
      this.velo.x *= global.friction;
      //Update
      this.target.x += this.velo.x;
      this.target.y += this.velo.y;
      global.target = this.target;
      global.velo = this.velo;
    }

    directional(key) {
    	return this.horizontal(key) || this.vertical(key);
    }

    horizontal(key) {
    	return (key == global.KEY_LEFT || key == global.KEY_LEFT_ALT) || (key == global.KEY_RIGHT || key == global.KEY_RIGHT_ALT);
    }

    vertical(key) {
    	return (key == global.KEY_DOWN || key == global.KEY_DOWN_ALT) || (key == global.KEY_UP || key == global.KEY_UP_ALT);
    }

    // Register when the mouse goes off the canvas.
    outOfBounds() {
        if (!global.continuity) {
            this.parent.target = { x : 0, y: 0 };
            global.target = this.parent.target;
        }
    }

    gameInput(mouse) {
    	if (!this.directionLock) {
    		this.parent.target.x = mouse.clientX - this.width / 2;
    		this.parent.target.y = mouse.clientY - this.height / 2;
            global.target = this.parent.target;
    	}
    }

    touchInput(touch) {
        touch.preventDefault();
        touch.stopPropagation();
    	if (!this.directionLock) {
    		this.parent.target.x = touch.touches[0].clientX - this.width / 2;
    		this.parent.target.y = touch.touches[0].clientY - this.height / 2;
            global.target = this.parent.target;
    	}
    }

    // Chat command callback functions.
    keyInput(event) { //Do not run right now
    	/*var key = event.which || event.keyCode;
    	if (key === global.KEY_FIREFOOD && this.parent.reenviar) {
            this.parent.socket.emit('1');
            this.parent.reenviar = false;
        }
        else if (key === global.KEY_SPLIT && this.parent.reenviar) {
            document.getElementById('split_cell').play();
            this.parent.socket.emit('2');
            this.parent.reenviar = false;
        }
        else if (key === global.KEY_CHAT) {
            document.getElementById('chatInput').focus();
        }*/
    }
}
