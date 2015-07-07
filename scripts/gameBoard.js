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
			pos = {},
			positions = [];

		function clearBoard() {
			ctx.clearRect(0, 0, c.width, c.height);
		};

		function showPosition(e) {
			pos = getClickPosition(e);
			positions.push(pos);
			ctx.beginPath();
			ctx.arc(pos.x, pos.y, 5, 0, 2 * Math.PI, false);
			ctx.fillStyle = '#C00';
			ctx.lineWidth = 2;
			ctx.strokeStyle = '#F00';
			ctx.stroke();
			ctx.fill();

			if (positions.length === 2) {
				// Draw path between positions
				ctx.beginPath();
				ctx.moveTo(positions[0].x, positions[0].y);
				ctx.lineTo(positions[1].x, positions[1].y);
				ctx.stroke();
			} else if (positions.length > 2) {
				// Clear the canvas
				clearBoard();
				positions = [];
			}
		};

		function render() {
			window.requestAnimFrame(this.render);
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