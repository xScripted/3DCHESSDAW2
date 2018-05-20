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
    inputs[0].addEventListener("click", () => socket.emit('crearSala', {modalidad: modalidad.value, tiempo: tiempo.value}));
    inputs[2].addEventListener("click", () => socket.emit('borrarSala'));
    socket.on('ok', (listaPartidas) => {
        let taulaHTML = "<div><div>Sala</div><div>Jugadores</div><div>Tiempo</div><div>Modo</div><div>Estado</div><div>Entrar</div></div></div>";
        for(let j of listaPartidas)taulaHTML += `<div><div>${j.name.slice(0,3)}</div><div>${j.players}/2</div><div>${toTimeSystem(j.time1)} ${toTimeSystem(j.time2)}</div><div>${j.modalidad}</div><div>${j.estat}</div><div><input class="unirse" type="button" data='${j.name}' value="Entrar"></div></div>`;
        taula.innerHTML = taulaHTML;
        let partidasUnise = document.querySelectorAll(".unirse");
        for(let j of partidasUnise)j.addEventListener("click", () => {
            socket.emit('joinSala', j.getAttribute("data"));
            room = j.getAttribute("data");
            j1 = false;
        });  
    })

    //socket.on('helper', (obj) => console.table(obj.board));
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //MENUS
    var lista1 = document.querySelectorAll("#menu div");

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
} 
    

function toTimeSystem(time){
    let min = Math.floor(time / 60);
    let seg = Math.floor(time % 60);
    let zero = seg < 10 ? "0" : "";
    return min + ":" + zero + seg;
}
