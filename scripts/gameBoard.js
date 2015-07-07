window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();

var gameBoard = (function(module) {
	var c = document.getElementById('gameBoard'),
		ctx = c.getContext('2d'),
		rect = c.getBoundingClientRect(),
		positions = [];

	module.init = function() {
		if(c){

			function showPosition(e){
				var pos = module.getPosition(e);
				positions.push(pos);

				ctx.beginPath();
				ctx.arc(pos.x, pos.y, 20, 0, 2*Math.PI, false);
				ctx.fillStyle = '#C00';
				ctx.lineWidth = 2;
				ctx.strokeStyle = '#F00';
				ctx.stroke();
				ctx.fill();

				if (positions.length === 2){
					// Draw path between positions
					ctx.beginPath();
					ctx.moveTo(positions[0].x, positions[0].y);
					ctx.lineTo(positions[1].x, positions[1].y);
					ctx.stroke();
				} else if (positions.length > 2){
					// Clear the canvas
					ctx.clearRect(0, 0, c.width, c.height);
					positions = [];
				}
			}

			c.addEventListener('click', showPosition, false);
		}
	};

	module.getPosition = function(e){
		return {
			x: e.clientX - rect.left,
			y: e.clientY - rect.top
		};
	};

	return module;
}(gameBoard || {}));

(function() {
	gameBoard.init();
})();