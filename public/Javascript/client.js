var socket = io();
var timer;
var t1 = t2 = 600; //Segundos
var turno = "blanco";
var threebg = "gray";
var room;
var j1 = true; //Indica si es el jugador 1 o 2;

function client() {
    //Socket IO
    var inputs = document.querySelectorAll("#crearysalir input");
    inputs[0].addEventListener("click", () => socket.emit('crearSala'));
    inputs[1].addEventListener("click", () => socket.emit('borrarSala'));
    socket.on('ok', (listaPartidas) => {
        let taulaHTML = "<div><div>Sala</div><div>Jugadors</div><div>Estat</div><div>Entrar</div></div></div>";
        for(let j of listaPartidas)taulaHTML += `<div><div>${j.name.slice(0,3)}</div><div>${j.players}/2</div><div>${j.estat}</div><div><input class="unirse" type="button" data='${j.name}' value="Entrar"></div></div>`;
        taula.innerHTML = taulaHTML;
        let partidasUnise = document.querySelectorAll(".unirse");
        for(let j of partidasUnise)j.addEventListener("click", () => {
            socket.emit('joinSala', j.getAttribute("data"));
            room = j.getAttribute("data");
            j1 = false;
        });  
    })

    socket.on('helper', (obj) => {
        console.log(obj);
    })
    //socket.on('tictoc', (times) => { //No funciona bien el orden
    //    timer1.innerHTML = toTimeSystem(times.t1);
    //    timer2.innerHTML = toTimeSystem(times.t2);
    //})
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    if(localStorage.getItem("bgcolor") != null)colorWeb(true); //LocalStorage
    if(localStorage.getItem("tbcolor") != null)colorTablero(true); //LocalStorage

    //MENUS
    var lista1 = document.querySelectorAll("#menu div");
    //Modos
    lista1[0].addEventListener("click", () => {
        chess.style.display = 'block';
        multiplayer.style.display = 'none';
    })
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
    menu2.addEventListener("mouseout",  () => {menu2.style.width = "50px"; menu.style.width = "50px"});
    menu2.addEventListener("mouseover", () => {menu2.style.width = "400px"; menu.style.width = "220px"});
    menu.addEventListener("mouseover",  () => menu.style.width = "220px");
    menu.addEventListener("mouseout", () => {
        menu2.style.width = "50px";
        menu.style.width = "50px";
    })   

    //COLORES
    inputColor.addEventListener("input" , () => colorWeb());
    inputColor2.addEventListener("input", () => colorTablero());
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

function toTimeSystem(time){
    let min = Math.floor(time / 60);
    let seg = Math.floor(time % 60);
    let zero = seg < 10 ? "0" : "";
    return min + ":" + zero + seg;
}

//COLOR TABLERO
function colorTablero() {   
    let cas = document.querySelectorAll(".cas_clara");
    if(arguments[0] && localStorage.getItem("tbcolor") != null)inputColor2.value = localStorage.getItem("tbcolor");
    localStorage.setItem("tbcolor", inputColor2.value);  
    //ct.style.backgroundColor = changeColor(inputColor2.value, 40);
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
    threebg = document.body.style.backgroundColor;
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
    //ct.style.backgroundColor = changeColor(inputColor.value, 40);
    [...cas].map((e) => e.style.backgroundColor = changeColor(inputColor.value, 10));  
    inputColor2.value = inputColor.value;
    tbcolor = inputColor.value;
}
