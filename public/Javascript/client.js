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
        let taulaHTML = "<table><tr><th>Sala</th><th>Jugadores</th><th>Tiempo</th><th>Modo</th><th>Estado</th><th>Entrar</th></tr>";
        for(let j of listaPartidas)taulaHTML += `<tr><td>${j.name.slice(0,3)}</td><td>${j.players}/2</td><td>${toTimeSystem(j.time1)}<br>${toTimeSystem(j.time2)}</td><td>${j.modalidad}</td><td>${j.estat}</td><td><input class="unirse" type="button" data='${j.name}' value="Entrar"></td></tr>`;
        taula.innerHTML = taulaHTML + "</table>";
        let partidasUnise = document.querySelectorAll(".unirse");
        for(let j of partidasUnise)j.addEventListener("click", () => {
            socket.emit('joinSala', j.getAttribute("data"));
            room = j.getAttribute("data");
            j1 = false;
        });  
    })
    //socket.on('helper', (obj) => console.table(obj.board));
} 
    

function toTimeSystem(time){
    let min = Math.floor(time / 60);
    let seg = Math.floor(time % 60);
    let zero = seg < 10 ? "0" : "";
    return min + ":" + zero + seg;
}
