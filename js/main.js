var canvas = document.getElementById('world');
var $canvas = $(canvas);
var ctx = canvas.getContext('2d');

var size = 100; // 100
var squareSize = canvas.width / size;

var grid;

function randColor(){
	return '#'+Math.floor(Math.random()*16777215).toString(16);
}

var count = 0;
var zoom = 1.0;
var scaleFlag = false;

var x_offset = 0;
var y_offset = 0;

function render(){
	if( !grid ){
		return;
	}
	// canvas display bounds checking
	if(zoom < 1){
		zoom = 1;
		x_offset = 0;
		y_offset = 0;
	} else {
		if( x_offset < 0 ) x_offset = 0;
		if( y_offset < 0 ) y_offset = 0;
		if( canvas.width  * zoom - canvas.width  < x_offset ) x_offset = -(canvas.width  * zoom - ( x_offset + canvas.width  ));
		if( canvas.height * zoom - canvas.height < y_offset ) y_offset = -(canvas.height * zoom - ( y_offset + canvas.height ));
	}

	//ctx.clearRect(0, 0, canvas.width, canvas.height);
	for(var x = 0; x < grid.length; x++){
		for(var y = 0; y < grid[x].length; y++){
			if( grid[x][y].changed || scaleFlag){
				ctx.fillStyle = grid[x][y].color;

				ctx.fillRect( Math.ceil(x * squareSize * zoom - x_offset), Math.ceil(y * squareSize * zoom - y_offset), Math.ceil(squareSize * zoom), Math.ceil(squareSize * zoom) );
				grid[x][y].changed = false;
			}
		}
	}
	scaleFlag = false;
}

$(canvas).bind("wheel mousewheel", function(e) {
	scaleFlag = true;
    e.preventDefault();
    var delta = parseInt(e.originalEvent.wheelDelta || -e.originalEvent.detail);
    var zoom_increment = (delta > 0) ? 1.1 : 0.9;
	x_offset += ( event.offsetX / canvas.width )  * ( (zoom_increment - 1) * canvas.width)  * (zoom);
	y_offset += ( event.offsetY / canvas.height ) * ( (zoom_increment - 1) * canvas.height) * (zoom);
	zoom *= zoom_increment;
});

$(canvas).bind('mousedown', function(event){

	$(canvas).bind('mousemove', function(event){
		var x = Math.floor( (event.offsetX + x_offset) / squareSize / zoom);
		var y = Math.floor( (event.offsetY + y_offset) / squareSize / zoom);
		var color =  $('input:checked').parent('.colorWrapper').children('.color').spectrum('get').toHexString();

		if(color != grid[x][y].color){

			grid[x][y].changed = true;

			socket.emit('colorChange', {
				x: x, 
				y: y, 
				color: grid[x][y].color, 
				changed: true
			});
		}

	});

	$(canvas).bind('mouseup', function(){
		$(canvas).unbind('mousemove');
	});

});



$(".color").spectrum();

$(".colorWrapper").click(function(){
	$(".colorWrapper").removeClass("checked");
	$(this).children("input:radio").attr('checked', true);
	$(this).toggleClass('checked', this.checked);
});

var $radioButtons = $('input[type="radio"]');
$radioButtons.click(function() {
    $radioButtons.each(function() {
        $(this).parent().toggleClass('checked', this.checked);
    });
});

setInterval(function(){
	render();
}, 16);

var socket = io.connect('/');

socket.on('fullGridState', function (data) {
	grid = data.fullgrid;
});

socket.on('cellUpdate', function (data) {
	console.log("Got update");
	grid[data.x][data.y] = {
		color: data.color,
		changed: data.changed
	};
});