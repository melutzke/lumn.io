var gridFile = 	"./gridstate.txt";
var grid = 		null;
var size = 		100;

var updateFlag = false;

var fs = 		require('fs');
var express = 	require('express');
var app = 		express();
var server = 	require('http').createServer(app).listen(80);
var io = 		require('socket.io').listen(server).set('log level', 1);

function randColor(){
	return (function(m,s,c){return (c ? arguments.callee(m,s,c-1) : '#') +
  		s[m.floor(m.random() * s.length)]})(Math,'0123456789ABCDEF',5)
}

function writeGridToFile(){
	if( ! updateFlag ) return;

	fs.writeFile(gridFile, JSON.stringify(grid), function (err) {
	  if (err) throw err;
	  console.log("file saved");
	  updateFlag = false;
	});
}

fs.readFile(gridFile, 'utf-8', function (err, content) {
    if (err) throw err;
    if(content){
    	grid = JSON.parse(content);
    }
    mainFunction();
});  



function mainFunction(){

	if( ! grid ){
		console.log("Randomizing grid, no file contents...");
		grid = [];
		grid.length = size;

		for(var x = 0; x < size; x++){
			grid[x] = [];
			grid[x].length = size;
			for(var y = 0; y < size; y++){
				grid[x][y] = {changed: true, color: randColor() };
			}
		}
		updateFlag = true;

		writeGridToFile();
	} else {
		console.log("Loaded grid from file.");
	}

	app.use(express.static(__dirname + '/'));
	app.use('/css', express.static(__dirname + '/css'));
	app.use('/js', express.static(__dirname + '/js'));
	app.use('/socket.io', express.static(__dirname + '/socket.io'));


	app.get('/', function(req, res) {
	  res.render('index.html');
	});

	io.sockets.on('connection', function (socket) {

		socket.emit('fullGridState', { 
			fullgrid: grid
		});

		socket.on('colorChange', function (data) {
			grid[data.x][data.y].color = data.color;
			updateFlag = true;
			socket.broadcast.emit('cellUpdate', { 
				x: data.x,
				y: data.y,
				color: data.color,
				changed: data.changed
			});
		});

	});

	setInterval(function(){
		writeGridToFile();
	}, (10 * 1000) );

}

