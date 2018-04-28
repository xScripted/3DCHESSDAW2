var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');
var listaPartidas = new Array();

app.listen(3000);
function handler (req, res) {
  fs.readFile(__dirname + '/client.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }
    res.writeHead(200);
    res.end(data);
  });
}

// Main <3
io.on('connection', function (socket) {
  actualitzarTaula();
  socket.on('crearSala',  () => crear(socket));
  socket.on('disconnect', () => borrar(socket));
  socket.on('borrarSala', () => borrar(socket));
  socket.on('joinSala', (id) => joinSala(socket, data));
});


function actualitzarTaula() {
  io.emit("ok", listaPartidas);
}

function crear(socket){
  let repe = true;
  for(let j of listaPartidas)if(j.id == socket.id)repe = false;
  if(repe){
    socket.join(socket.id);
    listaPartidas.push({id: socket.id, players: 1, spect: 0});    
    actualitzarTaula();
  }
}

function joinSala(socket, data) {
  for(let j of listaPartidas){
    if(j.id == data && j.players < 2){
      socket.join(data);
      j.players += 1;
      io.to(data).emit("msg");
      actualitzarTaula();
    }
  }
}

function borrar(socket){
  //Creem un nou array treient la sala
  listaPartidas = listaPartidas.filter((element) => element.id != socket.id);  
  actualitzarTaula();
}