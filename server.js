var gridFile = 	"./gridstate.txt";
var grid = 		null;
var size = 		100;

var updateFlag = false;

var fs = 		require('fs');
var express = 	require('express');
var app = 		express();
var server = 	require('http').createServer(app).listen(process.env.PORT || 80);
var io = 		require('socket.io').listen(server).set('log level', 1);

var pg = 		require('pg');





// 	fs.readFile(gridFile, 'utf-8', function (err, content) {
//     if (err) throw err;
//     if(content){
//     	grid = JSON.parse(content);
//     }
    



//     pg.connect(process.env.DATABASE_URL, function(newErr, client, done) {
//     if(newErr) console.log("Could not connect to DB: " + newErr);
// 	  client.query('UPDATE grid."gridData" SET "data" = $1 WHERE "id" = 1;', [JSON.stringify(grid)], function(newErrTwo, result) {
// 	  	if(newErrTwo){
// 	  		console.log("couldn't insert");
// 	  	} else {
// 	  		mainFunction();
// 	  	}

// 	  	//INSERT INTO grid."gridData" ("id", "data") VALUES (1, '{test:1}');
	    

// 	  });
// 	});




// });  






    pg.connect(process.env.DATABASE_URL, function(newErr, client, done) {
    if(newErr) console.log("Could not connect to DB: " + newErr);
	  client.query('SELECT "data" FROM grid."gridData" WHERE "id" = 1;', function(newErrTwo, result) {

	  	if(newErrTwo){
	  		console.log("couldn't SELECT");
	  		console.log("WE FAILED AT LIFE.");
	  	} else {
	  		console.log("Query worked:");
	  		console.log(result[0].charAt(0), result[0].charAt(result[0].length-1));
	  		grid = JSON.parse(result[0]);
	  		mainFunction();
	  	}
	    
	  });
	});




function randColor(){
	return (function(m,s,c){return (c ? arguments.callee(m,s,c-1) : '#') +
  		s[m.floor(m.random() * s.length)]})(Math,'0123456789ABCDEF',5)
}

function writeGridToFile(){
	if( ! updateFlag ) return;

	pg.connect(process.env.DATABASE_URL, function(newErr, client, done) {
    if(newErr) console.log("Could not connect to DB: " + newErr);
	  client.query('UPDATE grid."gridData" SET "data" = $1 WHERE "id" = 1;', [JSON.stringify(grid)], function(newErrTwo, result) {
	  	if(newErrTwo){
	  		console.log("couldn't insert");
	  	}
	  });
	});
}

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
			if(data && data.color){
				if( /^#[0-9A-F]{6}$/i.test(data.color) ){
					grid[data.x][data.y].color = data.color;
					updateFlag = true;
					socket.broadcast.emit('cellUpdate', { 
						x: data.x,
						y: data.y,
						color: data.color,
						changed: data.changed
					});
				}
			}
		});

	});

	setInterval(function(){
		writeGridToFile();
	}, (10 * 1000) );

}

