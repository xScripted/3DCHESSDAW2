var listaPartidas = new Array();
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const path = __dirname.replace(/\\/g, '/');//"/home/miquel/Escritorio/aje3d/3DCHESSDAW2/";
var test = require(path + '/testeos/test');
 

server.listen(3000);
app.get('/', (req, res) => res.sendFile(path + '/public/index.html'));
app.use(express.static(path + '/public'));
// Main <3
io.on('connection', (socket) => {
  socket.emit('ok', listaPartidas);
  var nick = "user" + socket.id.slice(0,3);
  var elo  = "";
  socket.on('getData', (user) => {
    nick = user.nick;
    elo  = user.elo; 
  });
  socket.on('crearSala',(tm) => crearSala(socket, tm, nick, elo));
  socket.on('disconnect', () => borrarSala(socket));
  socket.on('borrarSala', () => borrarSala(socket));
  socket.on('joinSala', (id) => joinSala(socket, id, nick, elo));
  socket.on('test',     (mv) => checkMove(socket, mv));
});

setInterval(() => io.emit('ok', listaPartidas), 1000);
function checkMove(socket, mv) {
  let obj = 0; 
  let autojaque;
  var returned = {
    move: true,
    mv: mv,
    kill: false,
    mode: "normal"
  }
  obj = listaPartidas.filter((e) => e.name == mv.room)[0];
  //partidaAcabada(obj, mv);
  if(typeof(obj) == "undefined" || typeof(obj.modalidad) == "undefined")return false; //Evitar moviments de clients sense sala
  returned.mode = obj.modalidad;
  returned.move = testMove(obj.board, mv);
  if(socket.id != obj.ids[obj.turn] || obj.board[mv.y1][mv.x1].color != obj.turn)returned.move = false;
  //Enroques
  if(obj != 0){ //Prescindible creo
    if(obj.board[mv.y1][0].tipo == "torre" && !(obj.board[mv.y1][0].used) && testJaque(obj.board) == 2 && !(obj.board[mv.y1][3].used) && 
    obj.board[mv.y1][mv.x1].tipo == "rey" && obj.modalidad == "Normal" && obj.board[mv.y1][0].color == obj.board[mv.y1][3].color && 
    obj.board[mv.y1][1] == 0 && obj.board[mv.y1][2] == 0 && mv.x2 == 1 && (mv.y2 == 0 || mv.y2 == 7)){
      if(mv.y1 == 0)obj.board = enroqueCorto(obj.board, 0, mv.room);
      if(mv.y1 == 7)obj.board = enroqueCorto(obj.board, 7, mv.room);
      returned.move = true;
    }
    if(obj.board[mv.y1][7].tipo == "torre" && !(obj.board[mv.y1][7].used) && testJaque(obj.board) == 2 && !(obj.board[mv.y1][3].used) && obj.board[mv.y1][mv.x1].tipo == "rey" && obj.board[mv.y1][7].color == obj.board[mv.y1][3].color
      && obj.board[mv.y1][6] == 0 && obj.board[mv.y1][5] == 0 && obj.board[mv.y1][4] == 0 && mv.x2 == 5 && (mv.y2 == 0 || mv.y2 == 7)){         
      if(mv.y1 == 0)obj.board = enroqueLargo(obj.board, 0, mv.room);
      if(mv.y1 == 7)obj.board = enroqueLargo(obj.board, 7, mv.room);
      if(testJaque(obj.board) == 2)returned.move = true;
    }
  }  

  //Jaque 0 = blanca, 1 = negra, 2 = no

  //Si hay jaque
  if(returned.move && obj.jaqueActivo != 2){
    //Hacemos la prediccion del proximo movimiento    
    let tmp = clone(obj.board);
    tmp[mv.y2][mv.x2] = tmp[mv.y1][mv.x1];
    tmp[mv.y1][mv.x1] = 0;  
    obj.jaqueActivo = testJaque(tmp, obj.jaqueActivo); //Comprobamos si es jaque
  }
  //Si no hay jaque
  if(returned.move && obj.jaqueActivo == 2){
    if(obj.board[mv.y2][mv.x2] != 0)returned.kill = true;
    obj.board[mv.y2][mv.x2] = obj.board[mv.y1][mv.x1];
    obj.board[mv.y1][mv.x1] = 0;
    obj.jaqueActivo = testJaque(obj.board, obj.jaqueActivo);    
    if(obj.jaqueActivo == obj.board[mv.y2][mv.x2].color){ //Si sigue habiendo jaque
      //Lo dejamos como estaba
      obj.jaqueActivo = 2;
      obj.board[mv.y1][mv.x1] = obj.board[mv.y2][mv.x2];
      obj.board[mv.y2][mv.x2] = 0;
    } else {      
      returned['cl'] = obj; //No me acuerdo para que sirve esto
      //console.log("Jaque: " + obj.jaqueActivo); MIRAR QUIN JAQUE ESTA ACTIU
      if(obj.jaqueActivo != 2 && testMate(obj.board, obj.jaqueActivo)) partidaAcabada(obj);        

      //Coronaciones 
      if(obj.board[mv.y2][mv.x2].tipo == "peon" && obj.board[mv.y2][mv.x2].color == 1 && mv.y2 == 0){
        io.to(mv.room).emit('coronaNegra', mv);
        obj.board[mv.y2][mv.x2].tipo = "dama";
      }
      if(obj.board[mv.y2][mv.x2].tipo == "peon" && obj.board[mv.y2][mv.x2].color == 0 && mv.y2 == 7){
        io.to(mv.room).emit('coronaBlanca', mv);
        obj.board[mv.y2][mv.x2].tipo = "dama";
      }
      obj.board[mv.y2][mv.x2].used = true;         
      obj.turn = 1 - obj.turn; //Toggle turn            
      for(let x of listaPartidas)if(x.name == mv.room)x.board = obj.board; // Retornamos el tablero posicionado
      if(obj.modalidad == "Spin"){
        for(let y in obj.board){
          obj.board[y].unshift(obj.board[y][obj.board[y].length - 1]);
          obj.board[y].pop();
        }
      }
      io.to(mv.room).emit('testReturned', returned);
    }
  }   
  //Helper
  io.to(mv.room).emit('helper', obj);
}

function enroqueCorto(tablero, Py, room){
  //tablero[Py][2].used = true;
  tablero[Py][2] = tablero[Py][0];
  tablero[Py][0] = 0;
  io.to(room).emit('ec', Py);
  return tablero;
}

function enroqueLargo(tablero, Py, room){
  //tablero[Py][2].used = true;
  tablero[Py][4] = tablero[Py][7];
  tablero[Py][7] = 0;
  io.to(room).emit('el', Py);
  return tablero;
}

function partidaAcabada(obj) {
  Usuario.update({nick: eval(`obj.player${obj.turn + 1}.nick`)}, { $inc: { victorias: 1, games: 1, time: obj.time - obj.time1, elo: 30 }}, (err, user) => console.log(user));
  Usuario.update({nick: eval(`obj.player${1 - obj.turn + 1}.nick`)}, { $inc: { derrotas: 1, games: 1, time: obj.time - obj.time1, elo: -30}}, (err, user) => console.log(user));
  io.to(obj.name).emit('mate', obj);
}

function crearSala(socket, data, nick, elo) {
  let repe = true;
  for(let j of listaPartidas)if(j.name == socket.id)repe = false;
  if(repe){
    io.emit('ok', listaPartidas);
    socket.join(socket.id); //Creem la sala 
    // Creem un objecte de la sala i la introduim al array de salas
    listaPartidas.push({
      name: socket.id, 
      estat: "Esperando...", 
      player1: {nick: nick, elo: elo},
      player2: {nick: "user", elo: ""},
      ids: new Array(), 
      players: 1, 
      modalidad: data.modalidad,
      board: initBoard(), 
      jaqueActivo: 2, 
      time: data.tiempo * 60,
      time1: data.tiempo * 60, 
      time2: data.tiempo * 60, 
      turn: 0
    }); 
    
    listaPartidas[listaPartidas.length - 1].ids.push(socket.id); //Llista de jugadors 
    io.emit('ok', listaPartidas);
  }
}

function joinSala(socket, data, nick, elo) {
  for(let j of listaPartidas){
    if(j.name == data && j.players < 2 && socket.id != data){
      borrarSala(socket);
      socket.join(data);
      j.ids.push(socket.id);    
      j.players += 1; 
      j.player2.nick = nick;
      j.player2.elo = elo;

      // NEW GAME
      if(j.players == 2){  
        io.emit('ok', listaPartidas);     
        j.estat = 'En Partida';
        io.to(j.name).emit('newGame', j); 
        if(j.modalidad == "Messy"){         
          j.board[0] = j.board[0].sort(() => Math.random() - 0.5);
          j.board[7] = j.board[7].sort(() => Math.random() - 0.5);
          io.to(j.name).emit('messy', j.board); 
        }
        let temps = setInterval(() => {
          if(j.turn == 0)j.time1 -= 1;
          if(j.turn == 1)j.time2 -= 1;
          if(j.time1 == 0 || j.time2 == 0){
            clearInterval(temps);
            partidaAcabada(j);
          }

          io.to(j.name).emit('tictoc', j); 
        }, 1000)     
      }    
      io.emit('ok', listaPartidas);
    }
  }
}
function borrarSala(socket){
  console.log(listaPartidas.find(e => e.ids.find(ee => ee == socket.id)));
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
  io.emit('ok', listaPartidas);
}

//INIT ARRAY FUNCTION
function initBoard(){
  let tmp = new Array(8).fill(0);
  for(let j in tmp)tmp[j] = new Array(8).fill(0);
  for(let y = 0; y < 8; y++){  
    for(let x = 0; x < 8; x++){     
      //Creating pieces
      //PAWNS
      if(y == 1)tmp = buildPieza(y, x, "peon", 0, tmp, test.peonBlanco);  
      if(y == 6)tmp = buildPieza(y, x, "peon", 1, tmp, test.peonNegro); 

      //TOWERS
      if(y == 0 && (x == 0 || x == 7))tmp = buildPieza(y, x, "torre", 0, tmp, test.torre);
      if(y == 7 && (x == 0 || x == 7))tmp = buildPieza(y, x, "torre", 1, tmp, test.torre);

      //BISHOPS
      if(y == 0 && (x == 2 || x == 5))tmp = buildPieza(y, x, "alfil", 0, tmp, test.alfil);
      if(y == 7 && (x == 2 || x == 5))tmp = buildPieza(y, x, "alfil", 1, tmp, test.alfil);

      //KNIGHTS
      if(y == 0 && (x == 1 || x == 6))tmp = buildPieza(y, x, "caballo", 0, tmp, test.caballo);
      if(y == 7 && (x == 1 || x == 6))tmp = buildPieza(y, x, "caballo", 1, tmp, test.caballo);
      
      //QUEEN
      if(y == 0 && x == 4)tmp = buildPieza(y, x, "dama", 0, tmp, test.dama);
      if(y == 7 && x == 4)tmp = buildPieza(y, x, "dama", 1, tmp, test.dama);

      //KING
      if(y == 0 && x == 3)tmp = buildPieza(y, x, "rey", 0, tmp, test.rey);
      if(y == 7 && x == 3)tmp = buildPieza(y, x, "rey", 1, tmp, test.rey);
    }    
  } 
  return tmp;
}

//Constructor de Piezas
function buildPieza(y, x, tipo, color, tmp, test){
  tmp[y][x] = new Pieza(tipo, color, x, test);
  return tmp;
}

class Pieza {
  constructor(tipo, color, x, test){
      this.color = color;
      this.tipo = tipo; //Peon, torre, reina, etc...
      this.used = false; // Solo para torres y reyes
      this.origx = x; //Para el modo Messy
      this.test = test;      
  }
}

//JAQUE
function testJaque(tablero, jaque) {
  let dy = 0, dx = 0;
  //Localizamos reyes
  for(let y in tablero){
    for(let x in tablero){
      if(tablero[y][x] != 0){
        if(tablero[y][x].tipo == "rey"){
          let anti = 1 - tablero[y][x].color;
          x = parseInt(x); // No deberian ser strings
          y = parseInt(y);
          //Test rectas
          for(let xoy = 0; xoy <= 7; xoy += 7){
            if(test.torre(tablero, y, x, xoy, x, tablero[y][x].color) == "jaque")return tablero[y][x].color;    
            if(test.torre(tablero, y, x, y, xoy, tablero[y][x].color) == "jaque")return tablero[y][x].color; 
          }       
          dy = y - x + 7;
          dx = x - y + 7;
          dy = dy > 7 ? 7 : dy;
          dx = dx > 7 ? 7 : dx;
          //Test diagonales
          if(test.alfil(tablero, y, x, dy, dx, tablero[y][x].color) == "jaque")return tablero[y][x].color; 
          dy = y - x;
          dx = x - y;
          dy = dy < 0 ? 0 : dy;
          dx = dx < 0 ? 0 : dx;
          if(test.alfil(tablero, y, x, dy, dx, tablero[y][x].color) == "jaque")return tablero[y][x].color; 
          dy = y + x;
          dx = y + x - 7;
          dx = dx < 0 ? 0 : dx;
          dy = dy > 7 ? 7 : dy;
          if(test.alfil(tablero, y, x, dy, dx, tablero[y][x].color) == "jaque")return tablero[y][x].color; 
          if(test.alfil(tablero, y, x, dx, dy, tablero[y][x].color) == "jaque")return tablero[y][x].color;
          
          //Test Caballos
          let c = [[2, -2],[1, -1]];
          for(let n = -2; n <= 2; n++) if(n != 0) for(let k of c[Math.abs(n) - 1]) if(test.caballo(tablero, y, x, y + n, x + k, tablero[y][x].color) == "jaque")return tablero[y][x].color;;

          //Test Peones
          if(tablero[y][x].color == 1){
            if(y > 0 && x < 7)if(tablero[y-1][x+1].tipo == "peon" && tablero[y-1][x+1].color == 0)return 1;
            if(y > 0 && x > 0)if(tablero[y-1][x-1].tipo == "peon" && tablero[y-1][x-1].color == 0)return 1;                                          
          }
          if(tablero[y][x].color == 0){
            if(y < 7 && x < 7)if(tablero[y+1][x+1].tipo == "peon" && tablero[y+1][x+1].color == 1)return 0;
            if(y < 7 && x > 0)if(tablero[y+1][x-1].tipo == "peon" && tablero[y+1][x-1].color == 1)return 0;                                          
          }              
        }
      }
    }
  }
  return 2;
}

function testMove(board, mv) {
  return board[mv.y1][mv.x1].test(board, mv.y1, mv.x1, mv.y2, mv.x2, board[mv.y1][mv.x1].color);
}

//JAQUE MATE
function testMate(tablero, color) {
  for(let y = 0; y < 8; y++){
    for(let x = 0; x < 8; x++){
      if(tablero[y][x] != 0 && tablero[y][x].color == color){
        for(let my = 0; my < 8; my++){
          for(let mx = 0; mx < 8; mx++){
            if(testMove(tablero,{y1: y, x1: x, y2: my, x2: mx})){
              let tmp = clone(tablero);
              tmp[my][mx] = tmp[y][x];
              tmp[y][x] = 0;
              if(testJaque(tmp) == 2)return false;
            }
          }
        }
      }
    }
  }
  return true;
}

function clone(obj){
  let nuevo = initArray(8,8);
  for(let y = 0; y < 8; y++)for(let x = 0; x < 8; x++)nuevo[y][x] = obj[y][x];
  return nuevo;
}
//INIT ARRAY FUNCTION
function initArray(y,x){
  let tmp = new Array(y).fill(0);
  for(let j in tmp)tmp[j] = new Array(x).fill(0);
  return tmp;
}

////////////////////////////////////////////////////////////// USUARIOS
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passport = require('passport');
const passportConfig = require(path +'/config/passport');
const controladorUsuario = require(path + '/controladores/usuario');
const Usuario = require(path + '/models/Usuario');
const ejs = require('ejs');
var db;

mongoose.Promise = global.Promise;
db = mongoose.connect("mongodb://localhost:27017/auth");
mongoose.connection.on('error', (err) => {
    throw err;
    process.exit(1);
})

app.use(session({
    secret: 'toran', //Lo utiliza el algoritmo de criptografia
    resave: true, //Guarda en cada llamada
    saveUninitialized: true, //Guarda en la bd el objeto vacio
    store: new MongoStore({
        url: "mongodb://localhost:27017/auth",
        autoReconnect: true
    })
}))

app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.post('/signup', controladorUsuario.postSignup, (req, res) => {
  res.render(path + '/public/views/chess.ejs', {user: req.user});
});
app.get('/ranking', (req, res) => {
  Usuario.find({}, (err, todo) => {    
    todo = Array.from(todo);    
    res.render(path + '/public/views/ranking.ejs', {data: todo.sort((a, b) => a.elo < b.elo)});
  });
})
app.get('/logout', passportConfig.estaAutenticado, controladorUsuario.logout);
app.get('/chess', (req, res) => {
  res.render(path + '/public/views/chess.ejs', {user: req.user});
})
app.post('/chess', controladorUsuario.postLogin, (req, res) => {
  res.render(path + '/public/views/chess.ejs', {user: req.user});
});
app.get('/profile', passportConfig.estaAutenticado, (req, res) => {  
  res.render(path + '/public/views/perfil.ejs', {user: req.user});
});


