var listaPartidas = new Array();
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(3000);

app.get('/', (req, res) => {
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
  socket.on('test',     (mv) => checkMove(socket, mv));
});

function checkMove(socket, mv) {
  var returned = {
    move: true,
    enroque: false
  }
  console.log("Log: ", socket.id,mv);

  socket.emit('testReturned', returned);
}

function actualitzarTaula() {
  io.emit('ok', listaPartidas);
}

function crearSala(socket){
  let repe = true;
  for(let j of listaPartidas)if(j.name == socket.id)repe = false;
  if(repe){
    socket.join(socket.id); //Creem la sala 
    listaPartidas.push({name: socket.id, estat: "Esperant...", ids: new Array(), players: 1, board: initBoard()}); // Creem un objecte de la sala i la introduim al array de salas
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
      // NEW GAME
      if(j.players == 2){       
        j.estat = 'In Game';
        io.to(j.name).emit('newGame', data);       
      }
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


//INIT ARRAY FUNCTION
function initBoard(){
  let tmp = new Array(8).fill(0);
  for(let j in tmp)tmp[j] = new Array(8).fill(0);
  for(let y = 0; y < 8; y++){  
    for(let x = 0; x < 8; x++){     
      //Creating pieces
      //PAWNS
      if(y == 1)tmp = buildPieza(y, x, "pb", "peonb.png", "peon", "blanco", tmp);  
      if(y == 6)tmp = buildPieza(y, x, "pn", "peon.png", "peon", "negro", tmp); 

      //TOWERS
      if(y == 0 && (x == 0 || x == 7))tmp = buildPieza(y, x, "tb", "torreb.png", "torre", "blanco", tmp);
      if(y == 7 && (x == 0 || x == 7))tmp = buildPieza(y, x, "tn", "torre.png", "torre", "negro", tmp);

      //BISHOPS
      if(y == 0 && (x == 2 || x == 5))tmp = buildPieza(y, x, "ab", "alfilb.png", "alfil", "blanco", tmp);
      if(y == 7 && (x == 2 || x == 5))tmp = buildPieza(y, x, "an", "alfil.png", "alfil", "negro", tmp);

      //KNIGHTS
      if(y == 0 && (x == 1 || x == 6))tmp = buildPieza(y, x, "cb", "cabb.png", "caballo", "blanco", tmp);
      if(y == 7 && (x == 1 || x == 6))tmp = buildPieza(y, x, "cn", "cab.png", "caballo", "negro", tmp);
      
      //QUEEN
      if(y == 0 && x == 4)tmp = buildPieza(y, x, "db", "damab.png", "dama", "blanco", tmp);
      if(y == 7 && x == 4)tmp = buildPieza(y, x, "dn", "dama.png", "dama", "negro", tmp);

      //KING
      if(y == 0 && x == 3)tmp = buildPieza(y, x, "rb", "reyb.png", "rey", "blanco", tmp);
      if(y == 7 && x == 3)tmp = buildPieza(y, x, "rn", "rey.png", "rey", "negro", tmp);
    }    
  } 
  return tmp;
}

//Constructor de Piezas
function buildPieza(y, x, id, url, tipo, color, tmp){
  tmp[y][x] = new Pieza(id + x, (y + "," + x), url,  tipo, color);
  return tmp;
}

//Temporal
class Pieza {
  constructor(id, coord, url, tipo, color){
      this.id = id;
      this.color = color;
      this.url = "img/" + url; //Imagen
      this.tipo = tipo; //Peon, torre, reina, etc...
      this.coord = coord;
      this.viva = true;
      this.used = false; // Solo para torres
  }
}