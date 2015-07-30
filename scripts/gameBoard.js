window.requestAnimFrame = (function () {
	return window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		function (callback) {
			window.setTimeout(callback, 1000 / 60);
		};
})();


	var GameBoard = (function () {
		var c = document.getElementById('gameBoard'),
			ctx = c.getContext('2d'),
			rect = c.getBoundingClientRect(),
			RAD = Math.PI/180,
			positions = [],
			lastFrameTime = 0,
			j,
			requestId, gridSize = 40;

		function clearBoard() {
			ctx.clearRect(0, 0, c.width, c.height);
		};

		function ClickSpot (position) {
			this.x = position.x;
			this.y = position.y;
			this.cx = position.cx;
			this.cy = position.cy;

			this.draw = function () {
				ctx.fillStyle = '#C00';
				ctx.strokeStyle = '#F00';
				ctx.moveTo(this.x, this.y);
				ctx.beginPath();
				ctx.fillRect(this.x, this.y, gridSize, gridSize);
				ctx.lineWidth = 2;
				ctx.stroke();
				ctx.fill();
			}
		};

		function JoiningLine () {
			this.start = positions[0];
			this.end = positions[1];
			this.width = positions[1].y - positions[0].y;
			this.height = positions[1].x - positions[0].x;
			this.current = {
				x: this.start.cx,
				y: this.start.cy
			}

			if(positions[1].cx < positions[0].cx){
				this.vx = -5;
			} else {
				this.vx = 5;
			}
			this.vy = this.vx * (this.width/this.height);
			console.log('vy: ', this.vy);

			this.update = function(){
				this.current.x += this.vx;
				this.current.y += this.vy;
			}

			this.penDown = function(x, y){
				ctx.moveTo(positions[0].cx, positions[0].cy);
					ctx.lineTo(x, y);
					ctx.strokeStyle = '#F00';
					ctx.stroke();
			}

			this.draw = function() {
				if(positions[1].x < positions[0].x){
					if((this.current.x >= this.end.cx)) {
						this.penDown(this.current.x, this.current.y);
					} else {
						this.penDown((this.end.cx), (this.end.cy));
						cancelAnimationFrame(requestId);
						return;
					}
				} else {
					if((this.current.x <= this.end.cx)) {
						this.penDown(this.current.x, this.current.y);
					} else {
						this.penDown(this.end.cx, this.end.cy);
						cancelAnimationFrame(requestId);
						return;
					}
				}
			}
		};

		function showPosition(e) {
			var pos = new ClickSpot(getClickPosition(e));
			pos.draw();
			positions.push(pos);

			if (positions.length === 2) {
				// Draw path between positions
				j = new JoiningLine();
				render();
			} else if (positions.length >= 2) {
				positions = [];
				// Clear the canvas
				clearBoard();
				//drawGrid();
			}
		};

		function render(elapsedTime) {
			var delta = elapsedTime - (lastFrameTime || 0);
			requestId = window.requestAnimFrame(render);

			if(lastFrameTime && delta < 33){
				return
			}

			lastFrameTime = elapsedTime;
			clearBoard();
			//drawGrid();

			for(var i = 0; i < positions.length; i++) {
				positions[i].draw();
			}
			j.update();
			j.draw();
		};

		function getClickPosition(e) {
			var posX = Math.floor((e.clientX - rect.left) / gridSize),
			posY = Math.floor((e.clientY - rect.top) / gridSize),
			x = (gridSize * posX),
			y = (gridSize * posY);
			return {
				x: x,
				y: y,
				cx: x + (gridSize/2),
				cy: y + (gridSize/2)
			};
		};

		function drawGrid() {
			// Verticle lines
			ctx.strokeStyle = '#0F0';
			ctx.lineWidth = 1;
			for(var i = 0; i < c.width; i += gridSize) {
				ctx.moveTo(i, 0);
				ctx.lineTo(i, c.height);
			}

			// Horizontal lines
			for(var j = 0; j < c.width; j += gridSize){
				ctx.moveTo(0, j);
				ctx.lineTo(c.width, j);
			}

			ctx.stroke();
		};

		function init() {
			//drawGrid();
			c.addEventListener('click', showPosition);
		}

		return {
			init: init
		}
})();

(function(){
	GameBoard.init();
}())