var gridFile = 	"./gridstate.txt";
var grid = 		null;
var size = 		200;

var updateFlag = false;

var fs = 		require('fs');
var express = 	require('express');
var app = 		express();
var server = 	require('http').createServer(app).listen(process.env.PORT || 80);
var io = 		require('socket.io').listen(server).set('log level', 1);

var pg = 		require('pg');

pg.connect(process.env.DATABASE_URL, function(newErr, client, done) {
if(newErr) console.log("Could not connect to DB: " + newErr);
  client.query('SELECT "data" FROM grid."gridData" WHERE "id" = 1;', function(newErrTwo, result) {

  	client.query.on('end', function() { 
	  client.end();
	});

  	if(newErrTwo){
  		console.log("couldn't SELECT, db query failed :(");
  	} else {
  		console.log("Query worked");
  		grid = JSON.parse(result.rows[0].data);
  		mainFunction();
  	}
    
  });
});

fs.readFile(gridFile, function(err, data){
	if( !err ){
		grid = JSON.parse(data);
		mainFunction();
	}
});

//mainFunction();




function randColor(){
	return (function(m,s,c){return (c ? arguments.callee(m,s,c-1) : '#') +
  		s[m.floor(m.random() * s.length)]})(Math,'0123456789ABCDEF',5)
}

function writeGridToFile(){
	//if( ! updateFlag ) return;

	console.log("Before db connection");

	pg.connect(process.env.DATABASE_URL, function(newErr, client, done) {
    if(newErr) console.log("Could not connect to DB: " + newErr);
	  	client.query('UPDATE grid."gridData" SET "data" = $1 WHERE "id" = 1;', [JSON.stringify(grid)], function(newErrTwo, result) {
		  	if(newErrTwo){
		  		console.log("couldn't insert");
		  	} else {
		  		console.log("WRITE SUCCESSFUL");
		  	}
		});
	  	client.query.on('end', function() { 
		  client.end();
		});
	});
}

function mainFunction(){

	if( ! grid ){
		throw Error("Failed to load grid from database :'(");
		writeGridToFile();
	} else {
		console.log("Loaded grid from PG successfully.");
	}

	app.use(express.static(__dirname + '/'));
	app.use('/css', express.static(__dirname + '/css'));
	app.use('/js', express.static(__dirname + '/js'));
	app.use('/socket.io', express.static(__dirname + '/socket.io'));
	app.use('/write', function(){
		writeGridToFile();
	});


	app.get('/', function(req, res) {
	  res.render('index.html');
	});

	io.sockets.on('connection', function (socket) {

		socket.emit('fullGridState', { 
			fullgrid: grid
		});

		socket.on('colorChange', function (data) {
			if(data && data.color && data.x && data.y && data.x < size && data.x >= 0 && data.y >= 0 && data.y < size){

				var change = grid[data.x][data.y] != data.color;

				if( change && /^#[0-9A-F]{6}$/i.test(data.color) ){
					grid[data.x][data.y].color = data.color;
					updateFlag = true;
					
					var emitData = { 
						x: data.x,
						y: data.y,
						color: data.color,
						changed: true
					};

					socket.broadcast.emit('cellUpdate', emitData);
				}

			}
		});

	});

	setInterval(function(){
		writeGridToFile();
	}, 1000 );

}

