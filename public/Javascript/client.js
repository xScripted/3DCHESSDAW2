var socket = io();
var room;
var j1 = true; //Indica si es el jugador 1 o 2;

function client() {
    //Socket IO
    var inputs = document.querySelectorAll("#crearysalir input");
    inputs[0].addEventListener("click", () => {
        socket.emit('crearSala', {modalidad: modalidad.value, tiempo: Math.abs(tiempo.value)});
    })
    inputs[2].addEventListener("click", () => socket.emit('borrarSala'));
    socket.on('ok', (listaPartidas) => {
        let taulaHTML = "<table><tr><th>Sala</th><th>Jugadores</th><th>Tiempo</th><th>Modo</th><th>Estado</th><th>Entrar</th></tr>";
        for(let j of listaPartidas)taulaHTML += `<tr><td>${j.player1.nick}</td><td>${j.players}/2</td><td>${toTimeSystem(j.time1)}<br>${toTimeSystem(j.time2)}</td><td>${j.modalidad}</td><td>${j.estat}</td><td><input class="unirse" type="button" data='${j.name}' value="Entrar"></td></tr>`;
        taula.innerHTML = taulaHTML + "</table>";
        let partidasUnise = document.querySelectorAll(".unirse");
        for(let j of partidasUnise)j.addEventListener("click", () => {
            socket.emit('joinSala', j.getAttribute("data"));
            room = j.getAttribute("data");
            j1 = false;
        });  
    })

    //MENU
    let minis = document.querySelectorAll('#menu *');
    minis[0].addEventListener('click', () => self.location='/ranking');
    minis[1].addEventListener('click', () => self.location='/chess');
    minis[2].addEventListener('click', () => self.location='/profile');
    minis[3].addEventListener('click', () => self.location='/logout'); 

    //CHAT
    let botones = document.querySelectorAll(".boton");
    botones[0].addEventListener('click', () => {
        if(botones[0].getAttribute("tablas") == "false") {
            botones[0].style.backgroundColor = "pink";        
            botones[0].setAttribute("tablas", "true");  
            socket.emit('tablas', true);   
        } else {
            botones[0].style.backgroundColor = "transparent";  
            botones[0].setAttribute("tablas", "false");  
            socket.emit('tablas', false);        
        }
    });
    botones[1].addEventListener('click', () => socket.emit('borrarSala', true));
    botones[2].addEventListener('click', () => {
        socket.emit('chat', msg.value);
        msg.value = "";
    });
    socket.on('mensaje', (msg) => {
        let d = document.createElement("div");
        let txt = document.createTextNode(msg);
        d.appendChild(txt);
        contchat.appendChild(d);
    });
} 

function toTimeSystem(time){
    let min = Math.floor(time / 60);
    let seg = "0" + Math.floor(time % 60);
    return min + ":" + seg.slice(-2);
}


