//Array contenedor del tablero
//Deberia ser asi = new Array(8).fill(new Array(8).fill(0));
var tablero = [new Array(8).fill(0), new Array(8).fill(0), new Array(8).fill(0), new Array(8).fill(0), new Array(8).fill(0), new Array(8).fill(0), new Array(8).fill(0), new Array(8).fill(0)];
var turno = "blanco";
var enroque = false;
var tbcolor;
//TIMER
var timer;
var t1 = t2 = 600; //Segundos

window.onload = () => {
    generarTablero();
    if(localStorage.getItem("bgcolor") != null)colorWeb(true); //LocalStorage
    if(localStorage.getItem("tbcolor") != null)colorTablero(true); //LocalStorage

    //RELOJES
    timer1.innerHTML = toTimeSystem(t1);
    timer2.innerHTML = toTimeSystem(t2);

    ///////////////// MENU //////////////////////////
    var lista1 = document.querySelectorAll("#menu div");

    //NEW GAME
    lista1[0].addEventListener("click",() => {
        [...document.querySelectorAll("#ct div")].map((e) => ct.removeChild(e));//Borramos Divs viejos
        p1min = 10, p1sec = 0, p2min = 10, p2sec = 0; //New Tiempo
        tablero = [new Array(8).fill(0), new Array(8).fill(0), new Array(8).fill(0), new Array(8).fill(0), new Array(8).fill(0), new Array(8).fill(0), new Array(8).fill(0), new Array(8).fill(0)];        
        generarTablero();
        colorTablero();
        chess.style.display = "block";
        multiplayer.style.display = "none";
    })
    //MENUS
    //Modos
    lista1[1].addEventListener("mouseover", () => {
        menu2.style.width = "400px";
        modos.style.display = "block";
        colorAll.style.display = "none";
    })

    //Colors
    lista1[2].addEventListener("mouseover", () => {
        menu2.style.width = "400px";
        colorAll.style.display = "block";
        modos.style.display = "none";
    })

    //Multiplayer
    lista1[3].addEventListener("click", () => {
        chess.style.display = "none";
        multiplayer.style.display = "block";
    })
    //DataTable
    $('#tablemp').DataTable();

    menu2.addEventListener("mouseout",  () => {menu2.style.width = "50px"; menu.style.width = "50px"});
    menu.addEventListener("mouseover",  () => menu.style.width = "220px");
    menu2.addEventListener("mouseover", () => {menu2.style.width = "400px"; menu.style.width = "220px"});
    menu.addEventListener("mouseout", () => {
        menu2.style.width = "50px";
        menu.style.width = "50px";
    })   

    //COLORES
    inputColor.addEventListener("input" , () => colorWeb());
    inputColor2.addEventListener("input", () => colorTablero());

}

function generarTablero() {    
    //Divs tablero
    for(let y = 0; y < 8; y++){  
        for(let x = 0; x < 8; x++){     
            let newDiv = document.createElement("div");
            //Colores Alternos
            if(x % 2 == 0 && y % 2 == 0 || x % 2 != 0 && y % 2 != 0)newDiv.setAttribute("class","cas_clara");
            newDiv.setAttribute("coord",`${x},${y}`);
            drop(newDiv);
            
            //Creando las piezas
            //PEONES
            if(y == 1)buildPieza(newDiv, y, x, "pb", "peonb.png", "peon", "blanco");  
            if(y == 6)buildPieza(newDiv, y, x, "pn", "peon.png", "peon", "negro");  

            //TORRES
            if(y == 0 && (x == 0 || x == 7))buildPieza(newDiv, y, x, "tb", "torreb.png", "torre", "blanco");
            if(y == 7 && (x == 0 || x == 7))buildPieza(newDiv, y, x, "tn", "torre.png", "torre", "negro");

            //ALFILES
            if(y == 0 && (x == 2 || x == 5))buildPieza(newDiv, y, x, "ab", "alfilb.png", "alfil", "blanco");
            if(y == 7 && (x == 2 || x == 5))buildPieza(newDiv, y, x, "an", "alfil.png", "alfil", "negro");

            //CABALLOS
            if(y == 0 && (x == 1 || x == 6))buildPieza(newDiv, y, x, "cb", "cabb.png", "caballo", "blanco");
            if(y == 7 && (x == 1 || x == 6))    buildPieza(newDiv, y, x, "cn", "cab.png", "caballo", "negro");
            
            //DAMAS
            if(y == 0 && x == 4)buildPieza(newDiv, y, x, "db", "damab.png", "dama", "blanco");
            if(y == 7 && x == 4)buildPieza(newDiv, y, x, "dn", "dama.png", "dama", "negro");

            //REYES
            if(y == 0 && x == 3)buildPieza(newDiv, y, x, "rb", "reyb.png", "rey", "blanco");
            if(y == 7 && x == 3)buildPieza(newDiv, y, x, "rn", "rey.png", "rey", "negro");
            ct.appendChild(newDiv);   
        }    
    } 
}

//Constructor de Piezas
function buildPieza(newDiv, y, x, id, url, tipo, color){
    tablero[y][x] = new Pieza(id + x, (y + "," + x), url,  tipo, color);
    var imgPieza = document.createElement("img");
    imgPieza.setAttribute("draggable","true");
    imgPieza.setAttribute("src","img/" + url);
    imgPieza.setAttribute("id",id + x);
    newDiv.appendChild(imgPieza);
    drag(imgPieza); 
}


//Drag & Drop Functions
function drag(imgPieza){
    imgPieza.addEventListener("dragstart", (ev) => ev.dataTransfer.setData("text", ev.target.id));
}

//CORE DEL JUEGO
function drop(newDiv){
    newDiv.addEventListener("contextmenu", (ev) => ev.preventDefault())
    newDiv.addEventListener("dragover", (ev) => ev.preventDefault())
    newDiv.addEventListener("drop", (ev) => {      
        ev.preventDefault();
        //Origen
        let data = ev.dataTransfer.getData("text"), //IMG ID
            coord = newDiv.getAttribute("coord").split(","),
            x = parseInt(coord[0]), //DIV DROP X
            y = parseInt(coord[1]), //DIV DROP Y
            allowPlay = true, Pya, Pxa; 

        //Actualizar Tablero
        for(let Py = 0; Py < 8; Py++){
            for(let Px = 0; Px < 8; Px++){                  
                if(tablero[Py][Px].id == data){
                    Pya = Py;
                    Pxa = Px;   
                    break;                 
                } //IF-ID
            } //Px
        } //Py  
                
        //TEST MOVIMIENTOS
        if(tablero[Pya][Pxa].tipo == "peon" && tablero[Pya][Pxa].color == "blanco")allowPlay = testPeonBlanco(allowPlay, Pya, Pxa, y, x); //TEST PEON B
        if(tablero[Pya][Pxa].tipo == "peon" && tablero[Pya][Pxa].color == "negro")allowPlay = testPeonNegro(allowPlay, Pya, Pxa, y, x); //TEST PEON N        
        if(tablero[Pya][Pxa].tipo == "torre")allowPlay = testTorres(allowPlay, Pya, Pxa, y, x, tablero[Pya][Pxa].color); //TEST TORRE B&N
        if(tablero[Pya][Pxa].tipo == "alfil")allowPlay = testAlfiles(allowPlay, Pya, Pxa, y, x, tablero[Pya][Pxa].color); //TEST ALFIL B&N
        if(tablero[Pya][Pxa].tipo == "dama")allowPlay = testDamas(allowPlay, Pya, Pxa, y, x, tablero[Pya][Pxa].color); //TEST DAMAS B&N
        if(tablero[Pya][Pxa].tipo == "caballo")allowPlay = testCaballos(allowPlay, Pya, Pxa, y, x, tablero[Pya][Pxa].color); //TEST CABALLOS B&N
        if(tablero[Pya][Pxa].tipo == "rey")allowPlay = testReyes(allowPlay, Pya, Pxa, y, x, tablero[Pya][Pxa].color); //TEST REYES B&N && ENROQUES
        testJaque(allowPlay, Pya, Pxa, y, x, tablero[Pya][Pxa].color);


        if(allowPlay && tablero[Pya][Pxa].color == turno){       
            let newCoord = newDiv.getAttribute("coord").split(",");  
            //PIEZA COMIDA
            if(tablero[y][x] != 0){
                if(turno == "blanco")trofeos1.appendChild(newDiv.children[0]);                
                if(turno == "negro")trofeos2.appendChild(newDiv.children[0]);                
            }
          
            tablero[y][x] = tablero[Pya][Pxa]; //Actualizamos la nueva casilla con la Pieza
            tablero[Pya][Pxa] = 0; //Borramos la casilla de inicio
            tablero[y][x].coord = newCoord[0] + "," + newCoord[1]; // Actualizamos las coord de la Pieza
            newDiv.appendChild(eval(data));//Add la Imagen

            //Enroque Remove Rey
            if(enroque){
                tablero[Pya][3] = 0;
                enroque = false;
            }
            //TURNO
            if(turno == "blanco"){
                turno = "negro"; 
                m2.style.color = "yellow";
                m1.style.color = "white";            
            } else { 
                turno = "blanco"; 
                m1.style.color = "yellow";
                m2.style.color = "white";
            }  
        } else {
            console.log("Movimiento Invalido!");
        }
    }) //DROP-EV
}


//PEON BLANCO                    //ORIGEN//DESTINO
function testPeonBlanco(allowPlay, Py, Px, y, x) { 
    if(Px != x || Py > y || tablero[Py + 1][Px] != 0 || tablero[y][x] != 0 || ((y - Py) > 1))allowPlay = false;  
    if(Py == 1 && y == 3 && tablero[2][x] == 0)allowPlay = true;      
    if((y == Py + 1 && x == Px + 1) && tablero[Py + 1][Px + 1].color == "negro")allowPlay = true;     
    if((y == Py + 1 && x == Px - 1) && tablero[Py + 1][Px - 1].color == "negro")allowPlay = true;    
    return allowPlay;
}

//PEON NEGRO                    
function testPeonNegro(allowPlay, Py, Px, y, x) { 
    if(Px != x || Py < y || tablero[Py - 1][Px] != 0 || tablero[y][x] != 0 || ((Py - y) > 1))allowPlay = false;  
    if(Py == 6 && y == 4 && tablero[5][x] == 0)allowPlay = true;    
    if((y == Py - 1 && x == Px + 1) && tablero[Py - 1][Px + 1].color == "blanco")allowPlay = true;     
    if((y == Py - 1 && x == Px - 1) && tablero[Py - 1][Px - 1].color == "blanco")allowPlay = true;     
    return allowPlay;
}

//TORRES
function testTorres(allowPlay, Py, Px, y, x, color) { 
    if(Py != y && Px != x)allowPlay = false;//DIAGONAL OFF
    if(allowPlay){
        //PALANTE
        if(Py < y){
            let m = Py;
            while(m < y){
                m++;
                if(tablero[m][Px].color == color || (tablero[m][Px] != 0 && m != y))allowPlay = false;
            }
        }
        //PATRAS
        if(Py > y){
            let m = Py;
            while(m > y){
                m--;
                if(tablero[m][Px].color == color || (tablero[m][Px] != 0 && m != y))allowPlay = false;
            }
        }
        //IZQUIERDA
        if(Px > x){
            let m = Px;
            while(m > x){
                m--;
                if(tablero[Py][m].color == color || (tablero[Py][m] != 0 && m != x))allowPlay = false;
            }
        }
        //DERECHA
        if(Px < x){
            let m = Px;
            while(m < x){
                m++;
                if(tablero[Py][m].color == color || (tablero[Py][m] != 0 && m != x))allowPlay = false;
            }
        }
    }
    if(allowPlay)tablero[Py][Px].used = true; //Cancelamos el enroque
    return allowPlay;
}

//ALFILES
function testAlfiles(allowPlay, Py, Px, y, x, color){
    let Mx = x;
    let My = y;
    if(y + Px == x + Py){
        if(y > Py){
            while(Mx != Px){
                if(tablero[My][Mx].color == color)allowPlay = false;
                Mx--;
                My--;
            }
        }
        if(y < Py){
            while(Mx != Px){
                if(tablero[My][Mx].color == color)allowPlay = false;
                Mx++;
                My++;
            }
        }   
    } else if (Math.abs(y - Px) == Math.abs(x - Py)) {
        if(y > Py){
            while(Mx != Px){
                if(tablero[My][Mx].color == color)allowPlay = false;
                Mx++;
                My--;
            }
        }
        if(y < Py){
            while(Mx != Px){
                if(tablero[My][Mx].color == color)allowPlay = false;
                Mx--;
                My++;
            }
        }   

    } else {
        allowPlay = false;
    }

    return allowPlay;
}

//DAMAS
function testDamas(allowPlay, Py, Px, y, x, color){
    let diagonalOrecto;
    if(Py == y && Px != x || Px == x && Py != y)diagonalOrecto = false;
    if(y + Px == x + Py || (Math.abs(y - Px) == Math.abs(x - Py)))diagonalOrecto = true;
    if(diagonalOrecto)allowPlay = testAlfiles(allowPlay, Py, Px, y, x, color);
    if(!diagonalOrecto)allowPlay = testTorres(allowPlay, Py, Px, y, x, color);
    if(diagonalOrecto == undefined)allowPlay = false;
    return allowPlay;
}

//CABALLOS
function testCaballos(allowPlay, Py, Px, y, x, color) {
    allowPlay = false;
    if((Py + 2 == y || Py - 2 == y ) && (Px + 1 == x || Px - 1 == x))allowPlay = true;
    if((Px + 2 == x || Px - 2 == x ) && (Py + 1 == y || Py - 1 == y))allowPlay = true;
    if(tablero[y][x].color == "blanco")allowPlay = false;    
    return allowPlay;
}

//REYES
function testReyes(allowPlay, Py, Px, y, x, color){    
    if(Math.abs(Py - y) > 1 || Math.abs(Px - x) > 1)allowPlay = false;
    var rDivs = [...document.querySelectorAll("#ct div")];

    //ENROQUES
    //CORTO
    if(tablero[Py][0].tipo == "torre" && !(tablero[Py][0].used) && tablero[Py][0].color == color && tablero[Py][1] == 0 && tablero[Py][2] == 0 && x == 1 && (y == 0 || y == 7)){
        allowPlay = true;
        tablero[Py][2] = tablero[Py][0];
        tablero[Py][0] = 0;
        document.querySelector(`div[coord="${2},${Py}"]`).appendChild(document.querySelector(`div[coord="${0},${Py}"]`).firstChild);//Movemos la imagen de la torre
        enroque = true;
    }
    //LARGO
    if(tablero[Py][7].tipo == "torre" && !(tablero[Py][7].used) && tablero[Py][7].color == color && tablero[Py][6] == 0 && tablero[Py][5] == 0 && tablero[Py][4] == 0 && x == 5 && (y == 0 || y == 7)){
        allowPlay = true;
        tablero[Py][4] = tablero[Py][7];
        tablero[Py][7] = 0;
        document.querySelector(`div[coord="${4},${Py}"]`).appendChild(document.querySelector(`div[coord="${7},${Py}"]`).firstChild);//Movemos la imagen de la torre
        enroque = true;
    }

    if(tablero[y][x].color == color)allowPlay = false;
    return allowPlay;
}

function toTimeSystem(time){
    let min = Math.floor(time / 60);
    let seg = Math.floor(time % 60);
    let zero = seg < 10 ? "0" : "";
    return min + ":" + zero + seg;
}
//COLORES

//COLOR TABLERO
function colorTablero() {   
    let cas = document.querySelectorAll(".cas_clara");
    if(arguments[0] && localStorage.getItem("tbcolor") != null)inputColor2.value = localStorage.getItem("tbcolor");
    localStorage.setItem("tbcolor", inputColor2.value);  
    ct.style.backgroundColor = changeColor(inputColor2.value, 40);
    [...cas].map((e) => e.style.backgroundColor = changeColor(inputColor2.value, 0));    
    tbcolor = inputColor2.value;
}


//COLOR WEB
function colorWeb() {
    let hoverDivs = document.querySelectorAll("#menu div"),
        cas = document.querySelectorAll(".cas_clara"),
        mds = modos.children;
        
    if(arguments[0] && localStorage.getItem("bgcolor") != null)inputColor.value = localStorage.getItem("bgcolor");
    //LocalStorage
    localStorage.setItem("bgcolor", inputColor.value);    

    document.body.style.backgroundColor = changeColor(inputColor.value, 50);
    menu.style.backgroundColor = inputColor.value;
    menu2.style.backgroundColor = changeColor(inputColor.value, 30);
    for(let x of hoverDivs){
        x.addEventListener("mouseover", () => x.style.backgroundColor = changeColor(inputColor.value, 60));
        x.addEventListener("mouseout", () => x.style.backgroundColor = "rgba(0,0,0,0)");
    }
    for(let x of mds){
        x.addEventListener("mouseover", () => x.style.backgroundColor = changeColor(inputColor.value, 60));
        x.addEventListener("mouseout", () => x.style.backgroundColor = "rgba(0,0,0,0)");
    }
    let whiteTob = menu.style.backgroundColor.split(/\W/);
    if(whiteTob[1] > 200 && whiteTob[3] > 200 && whiteTob[5] > 200)menu.style.color = "black";
    if(whiteTob[1] < 50 && whiteTob[3] < 50 && whiteTob[5] < 50)menu.style.color = "white";
    ct.style.backgroundColor = changeColor(inputColor.value, 40);
    [...cas].map((e) => e.style.backgroundColor = changeColor(inputColor.value, 10));  
    inputColor2.value = inputColor.value;
    tbcolor = inputColor.value;
}

function testJaque(allowPlay, Pya, Pxa, y, x, color) {
    for(let y in tablero){
        for(let x in tablero[y]){
            if(tablero[y][x].tipo == "rey" && tablero[y][x].color != color){
                console.log(tablero[y][x]);
            }
        }
    }
}


/* Oscurece un color hexadecimal de 6 caracteres #RRGGBB segun el porcentaje indicado */
function changeColor(color, amount){
    color = (color.indexOf("#")>=0) ? color.substring(1,color.length) : color;
    amount = parseInt((255*amount)/100);
    return color = `#${subtractLight(color.substring(0,2), amount)}${subtractLight(color.substring(2,4), amount)}${subtractLight(color.substring(4,6), amount)}`;
}

/* Resta el porcentaje indicado a un color (RR, GG o BB) hexadecimal para oscurecerlo */
const subtractLight = function(color, amount){
    let cc = parseInt(color,16) - amount;
    let c = (cc < 0) ? 0 : (cc);
    c = (c.toString(16).length > 1 ) ? c.toString(16) : `0${c.toString(16)}`;
    return c;
  }

//Relojes
timer = setInterval(() => {
    if(turno == "blanco"){
        timer1.innerHTML = toTimeSystem(t1);
        t1--;            
    } else {
        timer2.innerHTML = toTimeSystem(t2);
        t2--;
    }
    //COMPROBAMOS DERROTA POR TIEMPO
    if(t1 < 0 || t2 < 0){
        turno = turno == "blanco" ? "negras" : "blancas";
        alert("Las " +  turno +" ganan por tiempo");
        clearInterval(timer);
    }
},1000) 

