var listaPartidas = new Array();
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(3000);


app.get('/', function (req, res) {
  res.sendFile(__dirname + '/public/index.html');
});

app.use(express.static(__dirname + '/public'));
// Main <3
io.on('connection', (socket) => {
  actualitzarTaula();
  socket.on('crearSala',  () => crearSala(socket));
  socket.on('disconnect', () => borrarSala(socket));
  socket.on('borrarSala', () => borrarSala(socket));
  socket.on('joinSala', (id) => joinSala(socket,id));
});


function actualitzarTaula() {
  io.emit("ok", listaPartidas);
}

function crearSala(socket){
  let repe = true;
  for(let j of listaPartidas)if(j.name == socket.id)repe = false;
  if(repe){
    socket.join(socket.id); //Creem la sala 
    listaPartidas.push({name: socket.id, estat: "Esperant...", ids: new Array(), players: 1}); // Creem un objecte de la sala i la introduim al array de salas
    listaPartidas[listaPartidas.length - 1].ids.push(socket.id); //Llista de jugadors 
    actualitzarTaula();
  }
}

function joinSala(socket, data) {
  for(let j of listaPartidas){
    if(j.name == data && j.players < 2 && socket.id != data){
      borrarSala(socket);
      socket.join(data);
      j.ids.push(socket.id);    
      j.players += 1; 
      //io.to(data).emit("msg");
      actualitzarTaula();
    }
  }
}

function borrarSala(socket){
  listaPartidas = listaPartidas.filter((e) => e.name != socket.id);  //Creem un nou array treient la sala
  socket.leave(socket.name); // Sortim de la nostra propia sala
  socket.leave(Object.keys(socket.rooms)[0]); // Sortim de la sala anterior
  for(let j of listaPartidas){
    for(let x of j.ids){
      if(x == socket.id){
        j.players -= 1;
        j.ids = j.ids.filter((e) => e != socket.id); // Treiem el jugador de la llista
      }
    }
  }
  actualitzarTaula();
}