var canvas = document.getElementById('world');
var $canvas = $(canvas);
var ctx = canvas.getContext('2d');

var size = 100;
var squareSize = canvas.width / size;

var grid = [];
grid.length = size;

for(var x = 0; x < size; x++){
	grid[x] = [];
	grid[x].length = size;
}

for(var x = 0; x < grid.length; x++){
	for(var y = 0; y < grid[x].length; y++){
		grid[x][y] = {color: randColor(), changed: true};
	}
}

function randColor(){
	return '#'+Math.floor(Math.random()*16777215).toString(16);
}

var count = 0;

function render(){
	//ctx.clearRect(0, 0, canvas.width, canvas.height);
	for(var x = 0; x < grid.length; x++){
		for(var y = 0; y < grid[x].length; y++){
			if( grid[x][y].changed){
				ctx.fillStyle = grid[x][y].color;
				ctx.fillRect(x * squareSize, y * squareSize, squareSize, squareSize);
				grid[x][y].changed = false;
			}
		}
	}
}

$(canvas).bind('mousedown', function(event){
	var x = Math.floor(event.offsetX / squareSize);
	var y = Math.floor(event.offsetY / squareSize);
	grid[x][y].color = "#000000";
	grid[x][y].changed = true;
});

$(canvas).bind('mouseup', function(){
	$(canvas).unbind('mousemove');
})

$(".color").spectrum();

var $radioButtons = $('input[type="radio"]');
$radioButtons.click(function() {
    $radioButtons.each(function() {
        $(this).parent().toggleClass('checked', this.checked);
    });
});

setInterval(function(){
	for(var i = 0; i < 1; i++){
		var x = Math.floor( Math.random() * size );
		var y = Math.floor( Math.random() * size );
		grid[x][y].color = randColor();
		grid[x][y].changed = true;
	}
	render();
}, 16);