var app = {};
	app.canvasId = 		"world";
	app.canvas = 		document.getElementById( app.canvasId );
	app.$canvas = 		$(app.canvas);
	app.ctx = 			app.canvas.getContext('2d');
	app.mouseX = 		0;
	app.mouseY = 		0;
	app.mouseXPrev = 	0;
	app.mouseYPrev = 	0;
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

function interpMark(){
 	var x0 = app.mouseX;
 	var x1 = app.mouseXPrev;
 	var y0 = app.mouseY;
 	var y1 = app.mouseYPrev;
 	var tmp;

 	var steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);
 	if(steep){
 		tmp = x0; x0 = y0; y0 = tmp; // swap x0, y0
 		tmp = x1; x1 = y1; y1 = tmp; // swap x1, y1
 	}
 	if( x0 > x1 ){
 		tmp = x0; x0 = x1; x1 = tmp; // swap x0, x1
 		tmp = y0; y0 = y1; y1 = tmp; // swap y0, y1
 	}
 	var deltaX = x1 - x0;
 	var deltaY = Math.abs(y1 - y0);
 	var error = Math.floor(deltaX / 2);
 	var yStep;
 	var y = y0;
 	if( y0 < y1 ){
 		yStep = 1;
 	} else {
 		yStep = -1;
 	}
 	for(var x = x0; x <= x1; x++){
 		if( steep ){
 			drawPixel(y,x)
 		} else {
 			drawPixel(x,y)
 		}
 		error = error - deltaY;
 		if(error < 0){
 			y = y + yStep;
 			error = error + deltaX;
 		}
 	}
}

function drawPixel(x, y){
	if(x >= 0 && x < app.size && y >= 0 && y < app.size){
		app.grid[x][y].changed = true;
		app.grid[x][y].color = app.color;

		socket.emit('colorChange', {
			x: x, 
			y: y, 
			color: app.color, 
			changed: true
		});
	}
}

app.$canvas.bind("wheel mousewheel", function(e) {
	app.scaleFlag = true;
	e.preventDefault();

    var delta = parseInt(e.originalEvent.wheelDelta || -e.originalEvent.detail || -e.originalEvent.deltaY);

    scale(delta, app);
});

// app.$canvas.bind("mousemove", function(event){
//     var rect = app.canvas.getBoundingClientRect();
//     var mouse = getMouse(app.canvas, event, true);
//     app.mouseXPrev = app.mouseX;
//     app.mouseYPrev = app.mouseY;
//     app.mouseX = mouse.x;
//     app.mouseY = mouse.y;
// });

app.$canvas.bind('mousedown', function(event){

	var mouse = getMouse(app.canvas, event, true);
	app.mouseXPrev = 	mouse.x;
	app.mouseX = 		mouse.x;
	app.mouseYPrev =  	mouse.y;
	app.mouseY = 		mouse.y;

	app.color = $('input:checked').parent('.colorWrapper').children('.color').spectrum('get').toHexString();

	app.$canvas.bind('mousemove.dragging', function(event){

		var mouse = getMouse(app.canvas, event, true);

		app.mouseXPrev = app.mouseX;
		app.mouseYPrev = app.mouseY;
		app.mouseX = mouse.x;
		app.mouseY = mouse.y;

		interpMark();

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
