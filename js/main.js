var canvas = document.getElementById('world');
var $canvas = $(canvas);
var ctx = canvas.getContext('2d');

var size = 200; // 100
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

	console.log(zoom);

	//ctx.clearRect(0, 0, canvas.width, canvas.height);
	for(var x = 0; x < grid.length; x++){
		for(var y = 0; y < grid[x].length; y++){

			var xPos = Math.ceil(x * squareSize * zoom - x_offset);
			var yPos = Math.ceil(y * squareSize * zoom - y_offset);
			var width = Math.ceil(squareSize * zoom);
			var height = width;

			if( (grid[x][y].changed || scaleFlag) && xPos >= -width && xPos <= canvas.width && yPos >= -height && yPos <= canvas.height){
				ctx.fillStyle = grid[x][y].color;

				ctx.fillRect( xPos, yPos, width, height );
				grid[x][y].changed = false;
			}

		}
	}
	scaleFlag = false;
}

$(canvas).bind("wheel mousewheel", function(event) {
	event.preventDefault();
	scaleFlag = true;
    var delta = parseInt(event.originalEvent.wheelDelta || event.wheelDelta || event.originalEvent.deltaY);
    var zoom_increment = (delta > 0) ? 1.1 : 0.9;
	x_offset += ( (event.offsetX || event.clientX - $(event.target).offset().left) / canvas.width )  * ( (zoom_increment - 1) * canvas.width)  * (zoom);
	y_offset += ( (event.offsetY || event.clientY - $(event.target).offset().top) / canvas.height ) * ( (zoom_increment - 1) * canvas.height) * (zoom);
	zoom *= zoom_increment;
	console.log("zoom: ", zoom);
});

$(canvas).bind('mousedown', function(event){

	$(canvas).bind('mousemove', function(event){
		var x = Math.floor( ((event.offsetX || event.clientX - $(event.target).offset().left) + x_offset) / squareSize / zoom);
		var y = Math.floor( ((event.offsetY || event.clientY - $(event.target).offset().top) + y_offset) / squareSize / zoom);
		var color =  $('input:checked').parent('.colorWrapper').children('.color').spectrum('get').toHexString();

		if(x >= 0 && x < size && y >= 0 && y < size){
			grid[x][y].changed = true;
			grid[x][y].color = color;

			socket.emit('colorChange', {
				x: x, 
				y: y, 
				color: color, 
				changed: true
			});
		}

	});

	$(canvas).bind('mouseup', function(){
		$(canvas).unbind('mousemove');
	});

	$(canvas).trigger({
		type: "mousemove",
		offsetX: (event.offsetX || event.clientX - $(event.target).offset().left),
		offsetY: (event.offsetY || event.clientY - $(event.target).offset().top)
	});

});

var reconnectInterval = null;

$(".color").spectrum({
	showButtons: false
})
;
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

var socket = io.connect('');

socket.on('fullGridState', function (data) {
	grid = data.fullgrid;
	$('#world').css('opacity', '1');
	setTimeout(function(){
		$('#loading').css('opacity', '0');
		setTimeout(function(){
			$('#loading').css('display', 'none');
		},1000);
	}, 1000);
});

socket.on('cellUpdate', function (data) {
	grid[data.x][data.y] = {
		color: data.color,
		changed: data.changed
	};
});

socket.on('connect', function(){
	if( reconnectInterval ){
		clearInterval(reconnectInterval);
	}
});

socket.on('disconnect', function() {
	$('#loading').css('display', 'block')
		.text('Connection lost, reconnecting... Mitchell broke it.')
		.css('opacity', '1.0');

	reconnectInterval = setInterval( function(){

		socket.socket.reconnect(function(){
	    	//callback?
	    	setTimeout(function(){
			$('#loading').css('opacity', '0');
				setTimeout(function(){
					$('#loading').css('display', 'none');
				},1000);
			}, 1000);
	    });

	}, 2000);
    
});
