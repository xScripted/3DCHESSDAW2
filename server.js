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
  let obj = 0; 
  let autojaque;
  var returned = {
    move: true,
    mv: mv,
    kill: false
  }
  for(let x of listaPartidas)if(x.name == mv.room)obj = x;
  if(obj != 0){ // Error undefined
    if(obj.board[mv.y1][mv.x1].tipo == "peon" && obj.board[mv.y1][mv.x1].color == 0)returned.move = testPeonBlanco(obj.board, returned.move, mv.y1, mv.x1, mv.y2, mv.x2); //TEST PEON B
    if(obj.board[mv.y1][mv.x1].tipo == "peon" && obj.board[mv.y1][mv.x1].color == 1)returned.move = testPeonNegro (obj.board, returned.move, mv.y1, mv.x1, mv.y2, mv.x2); //TEST PEON N   
    if(obj.board[mv.y1][mv.x1].tipo == "torre")   returned.move = testTorres  (obj.board, returned.move, mv.y1, mv.x1, mv.y2, mv.x2, obj.board[mv.y1][mv.x1].color); //TEST TORRE B&N
    if(obj.board[mv.y1][mv.x1].tipo == "alfil")   returned.move = testAlfiles (obj.board, returned.move, mv.y1, mv.x1, mv.y2, mv.x2, obj.board[mv.y1][mv.x1].color); //TEST ALFIL B&N
    if(obj.board[mv.y1][mv.x1].tipo == "dama")    returned.move = testDamas   (obj.board, returned.move, mv.y1, mv.x1, mv.y2, mv.x2, obj.board[mv.y1][mv.x1].color); //TEST DAMAS B&N
    if(obj.board[mv.y1][mv.x1].tipo == "caballo") returned.move = testCaballos(obj.board, returned.move, mv.y1, mv.x1, mv.y2, mv.x2, obj.board[mv.y1][mv.x1].color); //TEST CABALLOS B&N
    if(obj.board[mv.y1][mv.x1].tipo == "rey")     returned.move = testReyes   (obj.board, returned.move, mv.y1, mv.x1, mv.y2, mv.x2, obj.board[mv.y1][mv.x1].color); //TEST REYES B&N    
    //Enroques
    if(obj.board[mv.y1][0].tipo == "torre" && !(obj.board[mv.y1][0].used) && testJaque(obj.board) == 2 && !(obj.board[mv.y1][3].used) && obj.board[mv.y1][mv.x1].tipo == "rey" && 
       obj.board[mv.y1][0].color == obj.board[mv.y1][3].color && obj.board[mv.y1][1] == 0 && obj.board[mv.y1][2] == 0 && mv.x2 == 1 && (mv.y2 == 0 || mv.y2 == 7)){
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

  /*Comprobar torn
  if(socket.id == obj.ids[obj.turn] && obj.board[mv.y1][mv.x1].color == obj.turn){ //Comprobar Torn && Color            
     obj.turn = obj.turn == 0 ? 1 : 0; //Toggle                
  } else {
      returned.move = false;
  }*/    

  //Jaque 0 = blanca, 1 = negra, 2 = no
  //Si hay jaque
  if(returned.move && obj.jaqueActivo != 2 && typeof(obj.board[mv.y2][mv.x2]) != "undefined"){
    //Hacemos la prediccion del proximo movimiento
    obj.board[mv.y2][mv.x2] = obj.board[mv.y1][mv.x1];
    obj.board[mv.y1][mv.x1] = 0;
    obj.jaqueActivo = testJaque(obj.board); //Comprobamos si es jaque
    //Lo dejamos como estaba
    obj.board[mv.y1][mv.x1] = obj.board[mv.y2][mv.x2];
    obj.board[mv.y2][mv.x2] = 0;
  }
  //Si no hay jaque
  if(returned.move && obj.jaqueActivo == 2){
    if(obj.board[mv.y2][mv.x2] != 0)returned.kill = true;
    obj.board[mv.y2][mv.x2] = obj.board[mv.y1][mv.x1];
    obj.board[mv.y1][mv.x1] = 0;
    obj.jaqueActivo = testJaque(obj.board);
    autojaque = obj.jaqueActivo == obj.board[mv.y2][mv.x2].color ? true : false;
    if(autojaque){
      //Lo dejamos como estaba
      obj.board[mv.y1][mv.x1] = obj.board[mv.y2][mv.x2];
      obj.board[mv.y2][mv.x2] = 0;
    } else {      
      returned['cl'] = obj; //No me acuerdo para que sirve esto
      obj.board[mv.y2][mv.x2].used = true;
      if(obj.board[mv.y2][mv.x2].tipo == "peon" && obj.board[mv.y2][mv.x2].color == 1 && mv.y2 == 0){
        io.to(mv.room).emit('coronaNegra', mv);
        obj.board[mv.y2][mv.x2].tipo = "dama";
      }
      if(obj.board[mv.y2][mv.x2].tipo == "peon" && obj.board[mv.y2][mv.x2].color == 0 && mv.y2 == 7){
        io.to(mv.room).emit('coronaBlanca', mv);
        obj.board[mv.y2][mv.x2].tipo = "dama";
      }
      for(let x of listaPartidas)if(x.name == mv.room)x.board = obj.board; // Retornamos el tablero posicionado
      io.to(mv.room).emit('testReturned', returned);
    }
  }   
  console.log("Jaque: " + obj.jaqueActivo);
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

function actualitzarTaula() {
  io.emit('ok', listaPartidas);
}

function crearSala(socket){
  let repe = true;
  for(let j of listaPartidas)if(j.name == socket.id)repe = false;
  if(repe){
    socket.join(socket.id); //Creem la sala 
    // Creem un objecte de la sala i la introduim al array de salas
    listaPartidas.push({
      name: socket.id, 
      estat: "Esperando...", 
      ids: new Array(), 
      players: 1, 
      board: initBoard(), 
      jaqueActivo: 2, 
      time1: 600, 
      time2: 600, 
      turn: Math.floor(Math.random()*2)
    }); 
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
        io.to(j.name).emit('newGame', j.ids); 

        setInterval(() => {
          if(j.turn == 0)j.time1 -= 1;
          if(j.turn == 1)j.time2 -= 1;
          io.to(j.name).emit('tictoc', {t1: j.time1, t2: j.time2}); 
        }, 1000)     
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
      if(y == 1)tmp = buildPieza(y, x, "peon", 0, tmp);  
      if(y == 6)tmp = buildPieza(y, x, "peon", 1, tmp); 

      //TOWERS
      if(y == 0 && (x == 0 || x == 7))tmp = buildPieza(y, x, "torre", 0, tmp);
      if(y == 7 && (x == 0 || x == 7))tmp = buildPieza(y, x, "torre", 1, tmp);

      //BISHOPS
      if(y == 0 && (x == 2 || x == 5))tmp = buildPieza(y, x, "alfil", 0, tmp);
      if(y == 7 && (x == 2 || x == 5))tmp = buildPieza(y, x, "alfil", 1, tmp);

      //KNIGHTS
      if(y == 0 && (x == 1 || x == 6))tmp = buildPieza(y, x, "caballo", 0, tmp);
      if(y == 7 && (x == 1 || x == 6))tmp = buildPieza(y, x, "caballo", 1, tmp);
      
      //QUEEN
      if(y == 0 && x == 4)tmp = buildPieza(y, x, "dama", 0, tmp);
      if(y == 7 && x == 4)tmp = buildPieza(y, x, "dama", 1, tmp);

      //KING
      if(y == 0 && x == 3)tmp = buildPieza(y, x, "rey", 0, tmp);
      if(y == 7 && x == 3)tmp = buildPieza(y, x, "rey", 1, tmp);
    }    
  } 
  return tmp;
}

//Constructor de Piezas
function buildPieza(y, x, tipo, color, tmp){
  tmp[y][x] = new Pieza(tipo, color);
  return tmp;
}

class Pieza {
  constructor(tipo, color){
      this.color = color;
      this.tipo = tipo; //Peon, torre, reina, etc...
      this.used = false; // Solo para torres y reyes
  }
}

//PEON BLANCO                   
function testPeonBlanco(tablero, allowPlay, Py, Px, y, x) { 
  if(Px != x || Py > y || tablero[Py + 1][Px] != 0 || tablero[y][x] != 0 || ((y - Py) > 1))allowPlay = false;  
  if(Px == x && Py == 1 && y == 3 && tablero[2][x] == 0)allowPlay = true;      
  if((y == Py + 1 && x == Px + 1) && tablero[Py + 1][Px + 1].color == 1)allowPlay = true;     
  if((y == Py + 1 && x == Px - 1) && tablero[Py + 1][Px - 1].color == 1)allowPlay = true;      
  return allowPlay;
}

//PEON NEGRO                    
function testPeonNegro(tablero, allowPlay, Py, Px, y, x) { 
  if(Px != x || Py < y || tablero[Py - 1][Px] != 0 || tablero[y][x] != 0 || ((Py - y) > 1))allowPlay = false;  
  if(Px == x && Py == 6 && y == 4 && tablero[5][x] == 0)allowPlay = true;    
  if((y == Py - 1 && x == Px + 1) && tablero[Py - 1][Px + 1].color == 0)allowPlay = true;     
  if((y == Py - 1 && x == Px - 1) && tablero[Py - 1][Px - 1].color == 0)allowPlay = true;     
  return allowPlay;
}

//TORRES
function testTorres(tablero, allowPlay, Py, Px, y, x, color) { 
  let anti = color == 0 ? 1 : 0;
  if(Py != y && Px != x)allowPlay = false;//DIAGONAL OFF
  if(allowPlay){
      //PALANTE
      if(Py < y){
          let m = Py;
          while(m < y){
              m++;
              if(tablero[Py][Px].tipo == "rey"){    
                if(tablero[m][Px].tipo != "torre" && tablero[m][Px].tipo != "dama" && tablero[m][Px] != 0 || tablero[m][Px].color == color)break;
                if((tablero[m][Px].tipo == "torre" || tablero[m][Px].tipo == "dama") && tablero[m][Px].color == anti)return "jaque";
              }
              if(tablero[m][Px].color == color || (tablero[m][Px] != 0 && m != y))allowPlay = false;            
          }
      }
      //PATRAS
      if(Py > y){
          let m = Py;
          while(m > y){
              m--;
              if(tablero[Py][Px].tipo == "rey"){    
                if(tablero[m][Px].tipo != "torre" && tablero[m][Px].tipo != "dama" && tablero[m][Px] != 0 || tablero[m][Px].color == color)break;
                if((tablero[m][Px].tipo == "torre" || tablero[m][Px].tipo == "dama") && tablero[m][Px].color == anti)return "jaque";
              }
              if(tablero[m][Px].color == color || (tablero[m][Px] != 0 && m != y))allowPlay = false;
          }
      }
      //IZQUIERDA
      if(Px > x){
          let m = Px;
          while(m > x){
              m--;
              if(tablero[Py][Px].tipo == "rey"){    
                if(tablero[m][Px].tipo != "torre" && tablero[m][Px].tipo != "dama" && tablero[m][Px] != 0 || tablero[m][Px].color == color)break;
                if((tablero[Py][m].tipo == "torre" || tablero[Py][m].tipo == "dama") && tablero[Py][m].color == anti)return "jaque";
              }
              if(tablero[Py][m].color == color || (tablero[Py][m] != 0 && m != x))allowPlay = false;
          }
      }
      //DERECHA
      if(Px < x){
          let m = Px;
          while(m < x){
              m++;
              if(tablero[Py][Px].tipo == "rey"){    
                if(tablero[m][Px].tipo != "torre" && tablero[m][Px].tipo != "dama" && tablero[m][Px] != 0 || tablero[m][Px].color == color)break;
                if((tablero[Py][m].tipo == "torre" || tablero[Py][m].tipo == "dama") && tablero[Py][m].color == anti)return "jaque";
              }
              if(tablero[Py][m].color == color || (tablero[Py][m] != 0 && m != x))allowPlay = false;
          }
      }      
  }
  if(allowPlay && tablero[Py][Px].tipo == "torre")tablero[Py][Px].used = true; //Cancelamos el enroque
  return allowPlay;
}

//ALFILES
function testAlfiles(tablero, allowPlay, Py, Px, y, x, color){
  let jaque = 2;
  let Mx = x;
  let My = y;
  let anti = color == 0 ? 1 : 0;
  if(y + Px == x + Py){ // Detectar diagonal
      if(y > Py){ // Diagonal positiva dreta
          while(Mx != Px){                
              if(tablero[Py][Px].tipo == "rey"){  
                if(tablero[My][Mx] != 0)jaque = 2; 
                if((tablero[My][Mx].tipo == "alfil" || tablero[My][Mx].tipo == "dama") && tablero[My][Mx].color == anti)jaque = "jaque";                
              }
              if(tablero[My][Mx].color == color)allowPlay = false;
              if(tablero[My][Mx].color == anti && Mx < x)allowPlay = false; // No traspas
              Mx--;
              My--;
          }
          if(tablero[Py][Px].tipo == "rey")return jaque;
      }
      if(y < Py){ // Diagonal negativa esquerra
          while(Mx != Px){
              if(tablero[Py][Px].tipo == "rey"){       
                if(tablero[My][Mx] != 0)jaque = 2; 
                if((tablero[My][Mx].tipo == "alfil" || tablero[My][Mx].tipo == "dama") && tablero[My][Mx].color == anti)jaque = "jaque";                
              }
              if(tablero[My][Mx].color == color)allowPlay = false;
              if(tablero[My][Mx].color == anti && Mx > x)allowPlay = false; // No traspas
              Mx++;
              My++;
          }
          if(tablero[Py][Px].tipo == "rey")return jaque;        
      }   
  } else if (Math.abs(y - Px) == Math.abs(x - Py)) {
      if(y > Py){ // Diagonal negativa dreta
          while(Mx != Px){
              if(tablero[Py][Px].tipo == "rey"){  
                if(tablero[My][Mx] != 0)jaque = 2; 
                if((tablero[My][Mx].tipo == "alfil" || tablero[My][Mx].tipo == "dama") && tablero[My][Mx].color == anti)jaque = "jaque";                
              }
              if(tablero[My][Mx].color == color)allowPlay = false;
              if(tablero[My][Mx].color == anti && Mx > x)allowPlay = false; // No traspas
              Mx++;
              My--;
          }
          if(tablero[Py][Px].tipo == "rey")return jaque; 
      }
      if(y < Py){// Diagonal positiva esquerra
          while(Mx != Px){
              if(tablero[Py][Px].tipo == "rey"){        
                if(tablero[My][Mx] != 0)jaque = 2; 
                if((tablero[My][Mx].tipo == "alfil" || tablero[My][Mx].tipo == "dama") && tablero[My][Mx].color == anti)jaque = "jaque";                
              }
              if(tablero[My][Mx].color == color)allowPlay = false;
              if(tablero[My][Mx].color == anti && Mx < x)allowPlay = false; // No traspas
              Mx--;
              My++;
          }
          if(tablero[Py][Px].tipo == "rey")return jaque; 
      }   
  } else {
      allowPlay = false;
  }

  return allowPlay;
}

//DAMAS
function testDamas(tablero, allowPlay, Py, Px, y, x, color){
  let diagonalOrecto;
  if(Py == y && Px != x || Px == x && Py != y)diagonalOrecto = false;
  if(y + Px == x + Py || (Math.abs(y - Px) == Math.abs(x - Py)))diagonalOrecto = true;
  if(diagonalOrecto)allowPlay = testAlfiles(tablero, allowPlay, Py, Px, y, x, color);
  if(!diagonalOrecto)allowPlay = testTorres(tablero, allowPlay, Py, Px, y, x, color);
  if(diagonalOrecto == undefined)allowPlay = false;
  return allowPlay;
}

//CABALLOS
function testCaballos(tablero, allowPlay, Py, Px, y, x, color) {
  allowPlay = false;
  y = y < 0 ? 0 : y;
  y = y > 7 ? 7 : y;
  x = x < 0 ? 0 : x;
  x = x > 7 ? 7 : x;
  let anti = color == 0 ? 1 : 0;
  if(tablero[Py][Px].tipo == "rey")if(typeof(tablero[y][x] != "undefined") && tablero[y][x] != 0)if(tablero[y][x].tipo == "caballo" && tablero[y][x].color == anti)return "jaque";
  if((Py + 2 == y || Py - 2 == y ) && (Px + 1 == x || Px - 1 == x))allowPlay = true;
  if((Px + 2 == x || Px - 2 == x ) && (Py + 1 == y || Py - 1 == y))allowPlay = true;
  if(tablero[y][x].color == color)allowPlay = false;    
  return allowPlay;
}

//REY
function testReyes(tablero, allowPlay, Py, Px, y, x, color){
  let anti = color == 0 ? 1 : 0;
  allowPlay = false;
  if(Math.abs(Py - y) <= 1 && Math.abs(Px - x) <= 1 && tablero[y][x].color != color)allowPlay = true;
  //Para que los reyes no se toquen entre si
  for(let ty = y - 1; ty <= y+1; ty++)for(let tx = x - 1; tx <= x+1; tx++)if(ty >= 0 && ty <= 7)if(typeof(tablero[ty][tx]) != "undefined")if(tablero[ty][tx].tipo == "rey" && tablero[ty][tx].color == anti)allowPlay = false;
  return allowPlay;
} 

//JAQUE
function testJaque(tablero) {
  let dy = 0, dx = 0;
  //Localizamos reyes
  for(let y in tablero){
    for(let x in tablero){
      if(tablero[y][x] != 0){
        if(tablero[y][x].tipo == "rey"){
          x = parseInt(x); // No deberia ser strings
          y = parseInt(y);
          //Test rectas
          if(testTorres(tablero, true, y, x, 7, x, tablero[y][x].color) == "jaque")return tablero[y][x].jaque = tablero[y][x].color;    
          if(testTorres(tablero, true, y, x, 0, x, tablero[y][x].color) == "jaque")return tablero[y][x].jaque = tablero[y][x].color;    
          if(testTorres(tablero, true, y, x, y, 7, tablero[y][x].color) == "jaque")return tablero[y][x].jaque = tablero[y][x].color;    
          if(testTorres(tablero, true, y, x, y, 0, tablero[y][x].color) == "jaque")return tablero[y][x].jaque = tablero[y][x].color;    
          dy = y - x + 7;
          dx = x - y + 7;
          dy = dy > 7 ? 7 : dy;
          dx = dx > 7 ? 7 : dx;
          //Test diagonales
          if(testAlfiles(tablero, true, y, x, dy, dx, tablero[y][x].color) == "jaque")return tablero[y][x].jaque = tablero[y][x].color; 
          dy = y - x;
          dx = x - y;
          dy = dy < 0 ? 0 : dy;
          dx = dx < 0 ? 0 : dx;
          if(testAlfiles(tablero, true, y, x, dy, dx, tablero[y][x].color) == "jaque")return tablero[y][x].jaque = tablero[y][x].color; 
          dy = y + x;
          dx = y + x - 7;
          dx = dx < 0 ? 0 : dx;
          dy = dy > 7 ? 7 : dy;
          if(testAlfiles(tablero, true, y, x, dy, dx, tablero[y][x].color) == "jaque")return tablero[y][x].jaque = tablero[y][x].color; 
          if(testAlfiles(tablero, true, y, x, dx, dy, tablero[y][x].color) == "jaque")return tablero[y][x].jaque = tablero[y][x].color;
          //Test Caballos
          if(testCaballos(tablero, true, y, x, y + 2, x + 1, tablero[y][x].color) == "jaque")return tablero[y][x].jaque = tablero[y][x].color;
          if(testCaballos(tablero, true, y, x, y + 2, x - 1, tablero[y][x].color) == "jaque")return tablero[y][x].jaque = tablero[y][x].color;
          if(testCaballos(tablero, true, y, x, y + 1, x - 2, tablero[y][x].color) == "jaque")return tablero[y][x].jaque = tablero[y][x].color;
          if(testCaballos(tablero, true, y, x, y + 1, x + 2, tablero[y][x].color) == "jaque")return tablero[y][x].jaque = tablero[y][x].color;
          if(testCaballos(tablero, true, y, x, y - 1, x - 2, tablero[y][x].color) == "jaque")return tablero[y][x].jaque = tablero[y][x].color;
          if(testCaballos(tablero, true, y, x, y - 1, x + 2, tablero[y][x].color) == "jaque")return tablero[y][x].jaque = tablero[y][x].color;
          if(testCaballos(tablero, true, y, x, y - 2, x - 1, tablero[y][x].color) == "jaque")return tablero[y][x].jaque = tablero[y][x].color;
          if(testCaballos(tablero, true, y, x, y - 2, x + 1, tablero[y][x].color) == "jaque")return tablero[y][x].jaque = tablero[y][x].color;
          //Test Peones
          if(tablero[y][x].color == 1){
            if(y > 0 && x < 7)if(tablero[y-1][x+1].tipo == "peon" && tablero[y-1][x+1].color == 0)return tablero[y][x].jaque = 1;
            if(y > 0 && x > 0)if(tablero[y-1][x-1].tipo == "peon" && tablero[y-1][x-1].color == 0)return tablero[y][x].jaque = 1;                                          
          }
          if(tablero[y][x].color == 0){
            if(y < 7 && x < 7)if(tablero[y+1][x+1].tipo == "peon" && tablero[y+1][x+1].color == 1)return tablero[y][x].jaque = 0;
            if(y < 7 && x > 0)if(tablero[y+1][x-1].tipo == "peon" && tablero[y+1][x-1].color == 1)return tablero[y][x].jaque = 0;                                          
          }
        }
      }
    }
  }
  return 2;
}

//JAQUE MATE
function testMate(tablero, color) {
  console.log("Color:",color);
}