var alfil = (tablero, Py, Px, y, x, color) => { 
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
var torre = (tablero, Py, Px, y, x, color) => { 
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



exports.peonBlanco = (tablero, Py, Px, y, x) => { 
  let allowPlay = true;
  if(Px != x || Py > y || tablero[Py + 1][Px] != 0 || tablero[y][x] != 0 || ((y - Py) > 1))allowPlay = false;  
  if(Px == x && Py == 1 && y == 3 && tablero[2][x] == 0)allowPlay = true;      
  if((y == Py + 1 && x == Px + 1) && tablero[Py + 1][Px + 1].color == 1)allowPlay = true;     
  if((y == Py + 1 && x == Px - 1) && tablero[Py + 1][Px - 1].color == 1)allowPlay = true;      
  return allowPlay;
 }

exports.peonNegro = (tablero, Py, Px, y, x) => { 
  let allowPlay = true;
  if(Px != x || Py < y || tablero[Py - 1][Px] != 0 || tablero[y][x] != 0 || ((Py - y) > 1))allowPlay = false;  
  if(Px == x && Py == 6 && y == 4 && tablero[5][x] == 0)allowPlay = true;    
  if((y == Py - 1 && x == Px + 1) && tablero[Py - 1][Px + 1].color == 0)allowPlay = true;     
  if((y == Py - 1 && x == Px - 1) && tablero[Py - 1][Px - 1].color == 0)allowPlay = true;     
  return allowPlay;
 }
exports.torre = torre;
exports.alfil = alfil;  
exports.dama = (tablero, Py, Px, y, x, color) => {
    let allowPlay = true;
    let diagonalOrecto;
    if(Py == y && Px != x || Px == x && Py != y)diagonalOrecto = false;
    if(y + Px == x + Py || (Math.abs(y - Px) == Math.abs(x - Py)))diagonalOrecto = true;
    if(diagonalOrecto)allowPlay = alfil(tablero, Py, Px, y, x, color);
    if(!diagonalOrecto)allowPlay = torre(tablero, Py, Px, y, x, color);
    if(diagonalOrecto == undefined)allowPlay = false;
    return allowPlay;
  }
exports.caballo = (tablero, Py, Px, y, x, color) => {
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
exports.rey = (tablero, Py, Px, y, x, color, test = false) => {
    let allowPlay = false;
    let anti = 1 - color;
    if(y > 7 || y < 0 || x > 7 || x < 0)return false;
    if(Math.abs(Py - y) <= 1 && Math.abs(Px - x) <= 1 && tablero[y][x].color != color)allowPlay = true;
    //Para que los reyes no se toquen entre si
    for(let ty = y - 1; ty <= y+1; ty++)for(let tx = x - 1; tx <= x+1; tx++)if(ty >= 0 && ty <= 7)if(typeof(tablero[ty][tx]) != "undefined")if(tablero[ty][tx].tipo == "rey" && tablero[ty][tx].color == anti)allowPlay = false;
    return allowPlay;
 } 

