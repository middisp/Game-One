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
			requestId;

			ctx.fillStyle = '#C00';
			ctx.lineWidth = 2;
			ctx.strokeStyle = '#F00';

		function clearBoard() {
			cancelAnimationFrame(requestId);
			ctx.clearRect(0, 0, c.width, c.height);
		};

		function ClickSpot () {

		};

		function JoiningLine () {
			this.start = positions[0];
			this.end = positions[1];
			this.width = positions[1].y - positions[0].y;
			this.height = positions[1].x - positions[0].x;
			this.current = {
				x: this.start.x,
				y: this.start.y
			}

			if(positions[1].x < positions[0].x){
				this.vx = -5;
			} else {
				this.vx = 5;
			}
			this.vy = (this.width/this.height) * this.vx;

			this.update = function(){
				console.log('running');
				this.current.x += this.vx;
				this.current.y += this.vy;
			}

			this.draw = function() {
				if(positions[1].x < positions[0].x){
					if((this.current.x > this.end.x) || (this.current.y > this.end.y)) {
						ctx.moveTo(positions[0].x, positions[0].y);
						ctx.lineTo(this.current.x, this.current.y);
						ctx.stroke();
					} else {
						cancelAnimationFrame(requestId);
						return;
					}
				} else {
				if((this.current.x < this.end.x) || (this.current.y < this.end.y)) {
					ctx.moveTo(positions[0].x, positions[0].y);
					ctx.lineTo(this.current.x, this.current.y);
					ctx.stroke();
				} else {
					cancelAnimationFrame(requestId);
					return;
				}
			}
			}
		};

		function showPosition(e) {
			var pos = getClickPosition(e);
			positions.push(pos);
			ctx.beginPath();
			ctx.arc(pos.x, pos.y, 5, 0, 2 * Math.PI, false);
			ctx.stroke();
			ctx.fill();

			if (positions.length === 2) {
				// Draw path between positions
				j = new JoiningLine();
				render();
			} else if (positions.length > 2) {
				// Clear the canvas
				clearBoard();
				positions = [];
			}
		};

		function render(elapsedTime) {
			var delta = elapsedTime - (lastFrameTime || 0);
			requestId = window.requestAnimFrame(render);

			if(lastFrameTime && delta < 33){
				return
			}

			lastFrameTime = elapsedTime;
			j.draw();
			j.update();
		};

		function getClickPosition(e) {
			return {
				x: e.clientX - rect.left,
				y: e.clientY - rect.top
			};
		};

		function init() {
			c.addEventListener('click', showPosition);
		}

		return {
			init: init
		}
})();

(function(){
	GameBoard.init();
}())