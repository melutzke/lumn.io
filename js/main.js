var app = {};
	app.canvasId = 		"world";
	app.canvas = 		document.getElementById( app.canvasId );
	app.$canvas = 		$(app.canvas);
	app.ctx = 			app.canvas.getContext('2d');
	app.mouseX = 		0;
	app.mouseY = 		0;
	app.grid = 			null;
	app.size = 			200;
	app.squareSize = 	app.canvas.width / app.size;
	app.x_offset = 		0;
	app.y_offset = 		0;
	app.zoom = 			1.0;
	app.scaleFlag = 	false;
	app.color = 		"#000000";

function randColor(){
	return '#'+Math.floor(Math.random()*16777215).toString(16);
}

function getMouse(canvas, evt, toGrid) {
    var rect = canvas.getBoundingClientRect();
    if( toGrid ){
    	return {
	      x: Math.floor( (evt.clientX - rect.left + app.x_offset) / app.squareSize / app.zoom ),
	      y: Math.floor( (evt.clientY - rect.top +  app.y_offset) / app.squareSize / app.zoom )
	    };
    } else {
    	return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
    }
    
}

function scale(delta){
    var zoom_increment = (delta > 0) ? 1.1 : 0.9;

	app.x_offset += ( app.mouseX / app.canvas.width )  * ( (zoom_increment - 1) * app.canvas.width)  * (app.zoom);
	app.y_offset += ( app.mouseY / app.canvas.height ) * ( (zoom_increment - 1) * app.canvas.height) * (app.zoom);

	app.zoom *= zoom_increment;

	if(app.zoom < 1){
		app.zoom = 1;
		app.x_offset = 0;
		app.y_offset = 0;
	} else {
		if( app.x_offset < 0 ) app.x_offset = 0;
		if( app.y_offset < 0 ) app.y_offset = 0;
		if( app.canvas.width  * app.zoom - app.canvas.width  < app.x_offset ){
			app.x_offset = -(app.canvas.width  * app.zoom - ( app.x_offset + app.canvas.width  ));
		}
		if( app.canvas.height * app.zoom - app.canvas.height < app.y_offset ){
			app.y_offset = -(app.canvas.height * app.zoom - ( app.y_offset + app.canvas.height ));
		}
	}
}

function transformDrawable(x, y, w, h){
	return {
		x: Math.ceil(x * app.squareSize * app.zoom - app.x_offset),
		y: Math.ceil(y * app.squareSize * app.zoom - app.y_offset),
		w: Math.ceil(w * app.zoom),
		h: Math.ceil(h * app.zoom)
	}
}

function render(){
	if( !app.grid ){
		return;
	}

	for(var x = 0; x < app.grid.length; x++){
		for(var y = 0; y < app.grid[x].length; y++){

			var newPt = transformDrawable(x, y, app.squareSize, app.squareSize);

			if( ( app.grid[x][y].changed || app.scaleFlag ) 
				&& newPt.x >= -newPt.w 
				&& newPt.x <= app.canvas.width 
				&& newPt.y >= -newPt.h 
				&& newPt.y <= app.canvas.height){

				app.ctx.fillStyle = app.grid[x][y].color;
				app.ctx.fillRect( newPt.x, newPt.y, newPt.w, newPt.h );

				app.grid[x][y].changed = false;
			}

		}
	}
	app.scaleFlag = false;
}

app.$canvas.bind("mousemove", function(event){
    var rect = app.canvas.getBoundingClientRect();
    app.mouseX = event.clientX - rect.left;
    app.mouseY = event.clientY - rect.top;
});

app.$canvas.bind("wheel mousewheel", function(e) {
	app.scaleFlag = true;
	e.preventDefault();

    var delta = parseInt(e.originalEvent.wheelDelta || -e.originalEvent.detail || -e.originalEvent.deltaY);

    scale(delta, app);
});


app.$canvas.bind('mousedown', function(event){

	app.color = $('input:checked').parent('.colorWrapper').children('.color').spectrum('get').toHexString();

	app.$canvas.bind('mousemove.dragging', function(event){

		var mouse = getMouse(app.canvas, event, true);

		if(mouse.x >= 0 && mouse.x < app.size && mouse.y >= 0 && mouse.y < app.size){
			app.grid[mouse.x][mouse.y].changed = true;
			app.grid[mouse.x][mouse.y].color = app.color;

			socket.emit('colorChange', {
				x: mouse.x, 
				y: mouse.y, 
				color: app.color, 
				changed: true
			});
		}

	});

	app.$canvas.bind('mouseup', function(){
		app.$canvas.unbind('mousemove.dragging');
	});

	var mousePos = getMouse(app.canvas, event, false);

	app.$canvas.trigger({
		type: "mousemove.dragging",
		clientX: event.clientX,
		clientY: event.clientY
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

$('input[type="radio"]').click(function() {
    $radioButtons.each(function() {
        $(this).parent().toggleClass('checked', this.checked);
    });
});

setInterval(function(){
	render();
}, 16);

var socket = io.connect('');

socket.on('fullGridState', function (data) {
	app.grid = data.fullgrid;
	$('#world').css('opacity', '1');
	setTimeout(function(){
		$('#loading').css('opacity', '0');
		setTimeout(function(){
			$('#loading').css('display', 'none');
		},1000);
	}, 1000);
});

socket.on('cellUpdate', function (data) {
	app.grid[data.x][data.y] = {
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
	    	setTimeout(function(){
			$('#loading').css('opacity', '0');
				setTimeout(function(){
					$('#loading').css('display', 'none');
				},1000);
			}, 1000);
	    });

	}, 2000);
    
});
