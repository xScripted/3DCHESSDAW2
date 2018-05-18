var listaPartidas = new Array();
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(3000);
app.get('/', (req, res) => res.sendFile(__dirname + '/public/index.html'));
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
  for(let x of listaPartidas)if(x.name == mv.room)obj = x; //Optimizable
  returned.move = testMove(obj.board, mv);
  if(socket.id != obj.ids[obj.turn] || obj.board[mv.y1][mv.x1].color != obj.turn)returned.move = false;
  //Enroques
  if(obj != 0){ //Prescindible creo
    if(obj.board[mv.y1][0].tipo == "torre" && !(obj.board[mv.y1][0].used) && testJaque(obj.board) == 2 && !(obj.board[mv.y1][3].
      used) && obj.board[mv.y1][mv.x1].tipo == "rey" && 
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
      if(obj.jaqueActivo != 2 && testMate(obj.board, obj.jaqueActivo))io.to(mv.room).emit('mate', obj.turn); ;        

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
      turn: 0
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
        j.estat = 'En Partida';
        io.to(j.name).emit('newGame', j); 

        let temps = setInterval(() => {
          if(j.turn == 0)j.time1 -= 1;
          if(j.turn == 1)j.time2 -= 1;
          if(j.time1 == 0 || j.time2 == 0)clearInterval(temps);

          io.to(j.name).emit('tictoc', j); 
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
function testPeonBlanco(tablero, Py, Px, y, x) { 
  let allowPlay = true;
  if(Px != x || Py > y || tablero[Py + 1][Px] != 0 || tablero[y][x] != 0 || ((y - Py) > 1))allowPlay = false;  
  if(Px == x && Py == 1 && y == 3 && tablero[2][x] == 0)allowPlay = true;      
  if((y == Py + 1 && x == Px + 1) && tablero[Py + 1][Px + 1].color == 1)allowPlay = true;     
  if((y == Py + 1 && x == Px - 1) && tablero[Py + 1][Px - 1].color == 1)allowPlay = true;      
  return allowPlay;
}

//PEON NEGRO                    
function testPeonNegro(tablero, Py, Px, y, x) { 
  let allowPlay = true;
  if(Px != x || Py < y || tablero[Py - 1][Px] != 0 || tablero[y][x] != 0 || ((Py - y) > 1))allowPlay = false;  
  if(Px == x && Py == 6 && y == 4 && tablero[5][x] == 0)allowPlay = true;    
  if((y == Py - 1 && x == Px + 1) && tablero[Py - 1][Px + 1].color == 0)allowPlay = true;     
  if((y == Py - 1 && x == Px - 1) && tablero[Py - 1][Px - 1].color == 0)allowPlay = true;     
  return allowPlay;
}

//TORRES
function testTorres(tablero, Py, Px, y, x, color) { 
  let anti = 1 - color;
  let [Mx, My] = [Px, Py];
  let d = [];

  if(Py == y || Px == x){
    if(Py < y) while(Py <= y) d.push(tablero[Py++][Px])  
    else if(Py > y) while(Py >= y) d.push(tablero[Py--][Px])
    else if(Px < x) while(Px <= x) d.push(tablero[Py][Px++])
    else if(Px > x) while(Px >= x) d.push(tablero[Py][Px--]); 

    if(tablero[My][Mx].tipo == "rey" && tablero[My][Mx].color == color){
        for(let e of d) {                
        if((e.tipo == "torre" || e.tipo == "dama") && e.color == anti)return "jaque";     
        if(e != 0 && e.tipo != "rey")return 2;
      }
      return 2;
    }
    return d.filter((e) => e != 0).length < 2 || (d.filter((e) => e != 0).length == 2 && d[d.length - 1].color == anti); //VALIDAMOS QUE NO HAYA PIEZAS DE POR MEDIO
  }
}

//ALFILES
function testAlfiles(tablero, Py, Px, y, x, color){ 
  let [Mx, My] = [Px, Py];
  let anti = 1 - color;

  if(Px + y == Py + x){
    let d = [];
    if(My < y) while(My <= y) d.push(tablero[My++][Mx++]);
    [Mx, My] = [Px, Py];
    if(My > y) while(My >= y) d.push(tablero[My--][Mx--]);    
    if(tablero[Py][Px].tipo == "rey" && tablero[Py][Px].color == color){
      for(let e of d) {                
        if((e.tipo == "alfil" || e.tipo == "dama") && e.color == anti)return "jaque";     
        if(e != 0 && e.tipo != "rey")return 2;
      }
      return 2;
    }
    return d.filter((e) => e != 0).length < 2 || (d.filter((e) => e != 0).length == 2 && d[d.length - 1].color == anti); //VALIDAMOS QUE NO HAYA PIEZAS DE POR MEDIO
  }
  if(Px + Py == x + y){ 
    let d = [];
    if(My < y) while(My <= y) d.push(tablero[My++][Mx--]);
    [Mx, My] = [Px, Py];
    if(My > y) while(My >= y) d.push(tablero[My--][Mx++]); 
    if(tablero[Py][Px].tipo == "rey" && tablero[Py][Px].color == color){
      for(let e of d) {                
        if((e.tipo == "alfil" || e.tipo == "dama") && e.color == anti)return "jaque";     
        if(e != 0 && e.tipo != "rey")return 2;
      }
      return 2;
    }   
    return d.filter((e) => e != 0).length < 2 || (d.filter((e) => e != 0).length == 2 && d[d.length - 1].color == anti); //VALIDAMOS QUE NO HAYA PIEZAS DE POR MEDIO
  }
  return false;
}

//DAMAS
function testDamas(tablero, Py, Px, y, x, color){
  let allowPlay = true;
  let diagonalOrecto;
  if(Py == y && Px != x || Px == x && Py != y)diagonalOrecto = false;
  if(y + Px == x + Py || (Math.abs(y - Px) == Math.abs(x - Py)))diagonalOrecto = true;
  if(diagonalOrecto)allowPlay = testAlfiles(tablero, Py, Px, y, x, color);
  if(!diagonalOrecto)allowPlay = testTorres(tablero, Py, Px, y, x, color);
  if(diagonalOrecto == undefined)allowPlay = false;
  return allowPlay;
}

//CABALLOS
function testCaballos(tablero, Py, Px, y, x, color) {
  let allowPlay = false;
  let anti = 1 - color;
  if(y >= 0 && y <= 7 && x >= 0 && x <= 7) {
    if((Py + 2 == y || Py - 2 == y ) && (Px + 1 == x || Px - 1 == x))allowPlay = true;
    if((Px + 2 == x || Px - 2 == x ) && (Py + 1 == y || Py - 1 == y))allowPlay = true;
    if(tablero[y][x].color == color)allowPlay = false;    
    if(allowPlay && tablero[y][x] != 0 && tablero[Py][Px].tipo == "rey" && tablero[y][x].tipo == "caballo" && tablero[y][x].color == anti)return "jaque";
  }
  return allowPlay;
}

//REY
function testReyes(tablero, Py, Px, y, x, color, test = false){
  let allowPlay = false;
  let anti = 1 - color;
  if(y > 7 || y < 0 || x > 7 || x < 0)return false;
  if(Math.abs(Py - y) <= 1 && Math.abs(Px - x) <= 1 && tablero[y][x].color != color)allowPlay = true;
  //Para que los reyes no se toquen entre si
  for(let ty = y - 1; ty <= y+1; ty++)for(let tx = x - 1; tx <= x+1; tx++)if(ty >= 0 && ty <= 7)if(typeof(tablero[ty][tx]) != "undefined")if(tablero[ty][tx].tipo == "rey" && tablero[ty][tx].color == anti)allowPlay = false;
  return allowPlay;
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
          x = parseInt(x); // No deberia ser strings
          y = parseInt(y);
          //Test rectas
          for(let xoy = 0; xoy <= 7; xoy += 7){
            if(testTorres(tablero, y, x, xoy, x, tablero[y][x].color) == "jaque")return tablero[y][x].color;    
            if(testTorres(tablero, y, x, y, xoy, tablero[y][x].color) == "jaque")return tablero[y][x].color; 
          }       
          dy = y - x + 7;
          dx = x - y + 7;
          dy = dy > 7 ? 7 : dy;
          dx = dx > 7 ? 7 : dx;
          //Test diagonales
          if(testAlfiles(tablero, y, x, dy, dx, tablero[y][x].color) == "jaque")return tablero[y][x].color; 
          dy = y - x;
          dx = x - y;
          dy = dy < 0 ? 0 : dy;
          dx = dx < 0 ? 0 : dx;
          if(testAlfiles(tablero, y, x, dy, dx, tablero[y][x].color) == "jaque")return tablero[y][x].color; 
          dy = y + x;
          dx = y + x - 7;
          dx = dx < 0 ? 0 : dx;
          dy = dy > 7 ? 7 : dy;
          if(testAlfiles(tablero, y, x, dy, dx, tablero[y][x].color) == "jaque")return tablero[y][x].color; 
          if(testAlfiles(tablero, y, x, dx, dy, tablero[y][x].color) == "jaque")return tablero[y][x].color;
          
          //Test Caballos
          let c = [[2, -2],[1, -1]];
          for(let n = -2; n <= 2; n++) if(n != 0) for(let k of c[Math.abs(n) - 1]) if(testCaballos(tablero, y, x, y + n, x + k, tablero[y][x].color) == "jaque")return tablero[y][x].color;;

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
  if(board[mv.y1][mv.x1].tipo == "peon" && board[mv.y1][mv.x1].color == 0)return testPeonBlanco(board, mv.y1, mv.x1, mv.y2, mv.x2); //TEST PEON B
  if(board[mv.y1][mv.x1].tipo == "peon" && board[mv.y1][mv.x1].color == 1)return testPeonNegro (board, mv.y1, mv.x1, mv.y2, mv.x2); //TEST PEON N   
  if(board[mv.y1][mv.x1].tipo == "torre")   return testTorres  (board, mv.y1, mv.x1, mv.y2, mv.x2, board[mv.y1][mv.x1].color); //TEST TORRE B&N
  if(board[mv.y1][mv.x1].tipo == "alfil")   return testAlfiles (board, mv.y1, mv.x1, mv.y2, mv.x2, board[mv.y1][mv.x1].color); //TEST ALFIL B&N
  if(board[mv.y1][mv.x1].tipo == "dama")    return testDamas   (board, mv.y1, mv.x1, mv.y2, mv.x2, board[mv.y1][mv.x1].color); //TEST DAMAS B&N
  if(board[mv.y1][mv.x1].tipo == "caballo") return testCaballos(board, mv.y1, mv.x1, mv.y2, mv.x2, board[mv.y1][mv.x1].color); //TEST CABALLOS B&N
  if(board[mv.y1][mv.x1].tipo == "rey")     return testReyes   (board, mv.y1, mv.x1, mv.y2, mv.x2, board[mv.y1][mv.x1].color); //TEST REYES B&N        
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
