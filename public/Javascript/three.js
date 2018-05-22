//////////////////////
//// Miquel Toran ////
//////////////////////

//Variables Globals !
var width, height;
var scene, camera, renderer;
var boardOBJ = initArray(8,8);
var piecesOBJ = initArray(8,8);
var color1 = "#FFEEC7", color2 = "#0099ff";
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2(), old;
var texture = new THREE.TextureLoader().load('img/glass.png');//Textura
var texture2 = new THREE.TextureLoader().load('img/rock.png');//Textura
var mv; // Obj de los movimientos
var wz = 2, bz = 5, wx = 9, bx = 9;
var subid = 0;
var enroqueC, enroqueL;
var modo = "normal";
// MAIN
window.onload = () => {
    client();
    init();
}

//Socket IO
socket.on('testReturned', (returned) => {         
    if(returned.move && returned.kill){
        if(piecesOBJ[returned.mv.y2][returned.mv.x2].nameColor == "black"){
            piecesOBJ[returned.mv.y2][returned.mv.x2].position.x = wx;
            piecesOBJ[returned.mv.y2][returned.mv.x2].position.y -= 0.3;
            piecesOBJ[returned.mv.y2][returned.mv.x2].position.z = wz;
            if(wz == 0){
                wz = 3;
                wx++; 
            }
            wz--;
        }
        if(piecesOBJ[returned.mv.y2][returned.mv.x2].nameColor == "white"){
            piecesOBJ[returned.mv.y2][returned.mv.x2].position.x = bx;
            piecesOBJ[returned.mv.y2][returned.mv.x2].position.y -= 0.3;
            piecesOBJ[returned.mv.y2][returned.mv.x2].position.z = bz;
            if(bz == 7){
                bz = 4;
                bx++; 
            }
            bz++;
        }
    }
    if(returned.move)mv = returned.mv;
})

socket.on('ec', (Py) => {
    enroqueC = Py;
    piecesOBJ[Py][2] = piecesOBJ[Py][0];
});

socket.on('el', (Py) => {
    enroqueL = Py;
    piecesOBJ[Py][4] = piecesOBJ[Py][7];
});

socket.on('coronaNegra', (mv) => {
    var loader = new THREE.ObjectLoader();
    piecesOBJ[1][mv.x1].name = mv.x1;    
    loader.load("models/set2/queen.json",  (obj) => {
        scene.getObjectByName(mv.x1).geometry = obj.geometry;
        scene.getObjectByName(mv.x1).position.y = 1.3;
    });
})

socket.on('coronaBlanca', (mv) => {
    var loader = new THREE.ObjectLoader();
    piecesOBJ[6][mv.x1].name = mv.x1;    
    loader.load("models/set2/queen.json",  (obj) => {
        scene.getObjectByName(mv.x1).geometry = obj.geometry;
        scene.getObjectByName(mv.x1).position.y = 1.3;
    }); 
})

socket.on('newGame', (info) => {
    modo = info.modalidad;
    removePieces();
    //genPieces();
    room = info.ids[0]; //Guardem en quina room esta   
    board3D.style.zIndex = 1; 
    multiplayer.style.zIndex = -1;
    loadTexts(info);
})

socket.on('messy', (board) => {
    let tmp = new Array(8);
    let tmp2 = new Array(8);
    for(let k in piecesOBJ[0])piecesOBJ[0][k].position.x = board[0][k].origx; 
    for(let k in piecesOBJ[7])piecesOBJ[7][k].position.x = board[7][k].origx; 
    for(let k in piecesOBJ[0])tmp[piecesOBJ[0][k].position.x] = piecesOBJ[0][k];
    piecesOBJ[0] = tmp;
    for(let k in piecesOBJ[7])tmp2[piecesOBJ[7][k].position.x] = piecesOBJ[7][k];
    piecesOBJ[7] = tmp2;
});

socket.on('mate', (ganador) => {
    let g = ["blancas", "negras"];
    alert("Ganan las " + g[ganador]);
})

socket.on('tictoc', (info) => loadTimers(info));
//////////////////////////////////////////////////////////////////////////////////////////////////

function init() {
    //Obtenim les dimensions del contenidor tablero3D
    width  = board3D.clientWidth;
    height = board3D.clientHeight;
    console.log(width, height);

    //Iniciem variables base
    scene = new THREE.Scene();//         FOV  ASPECT RATIO                           NEAR FAR
    camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(width, height);


    //PRUEBAS BACKGROUND
    scene.background = new THREE.CubeTextureLoader().setPath('../img/maps/')
	.load([
        'px.png',
        'nx.png',
        'py.png',
        'ny.png',
        'pz.png',
        'nz.png'
	]);

    ///////////////////////////*/
    let light = new THREE.AmbientLight("white"); // soft white light
    scene.add(light);
    newLight(20, 20, 20);
    newLight(-10, 20, 20);
    newLight(20, 20, -20);
    newLight(-10, 20, -20);
    newLight(-30, 1, 3.5, true);
    newLight(30, 1, 3.5, true);
    
    //*// CONTROL DE CAMARA    
    camera.position.set(0, 30, 30);

    var helper = new THREE.CameraHelper(camera);
    //scene.add(helper);

    let controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(4, 2, 4);
    controls.addEventListener('change',renderer);
    controls.minDistance = 0;
    controls.maxDistance = 500;
    controls.enablePan = false;
    controls.autoRotate = true;
    ////////////////////////////////*/

    //L'afegim al Div contenidor
    board3D.appendChild(renderer.domElement);
    newBoard();
    animate();
}

function newBoard(){
    var material = new THREE.MeshPhysicalMaterial({color: "#333399", dithering: true, map: texture2});
    var border = new THREE.BoxGeometry(10, 0.6, 1); 
    var border1 = new THREE.Mesh(border, material);
    var border2 = new THREE.Mesh(border, material);
    var border3 = new THREE.Mesh(border, material);
    var border4 = new THREE.Mesh(border, material);

    border1.position.set(3.5,0,-1); 
    border2.position.set(3.5,0,8);  
    border3.position.set(8,0,3.5);    
    border4.position.set(-1,0,3.5);
    border4.rotation.y = 1.57;
    border3.rotation.y = 1.57;

    scene.add(border1);  
    scene.add(border2); 
    scene.add(border3);  
    scene.add(border4); 

    for(let y = 0; y < 8; y++)for(let x = 0; x < 8; x++)boardOBJ[y][x] = genSquare(y,x); //Tauler
    genPieces();  
}

function genSquare(y,x){
    var geometry = new THREE.BoxGeometry(1, 0.5, 1);     //Tamany
    var color = (x % 2 == 0 && y % 2 == 0) || (x % 2 != 0 && y % 2 != 0) ? color1 : color2;     //Colors alternatius
    //MeshAll
    var material = new THREE.MeshPhysicalMaterial({color: color, dithering: true, map: texture});
    var cube = new THREE.Mesh(geometry, material);
    cube.position.x = x; 
    cube.position.z = y; //Profunditat
    cube["tipo"] = "board";
    scene.add(cube);  
    return cube;
}

function genPieces() {
    let white = {r: 1, g: 1, b:1}
    let black = {r: 0.2, g: 0.2, b:0.2}
    var loader = new THREE.ObjectLoader();
    for(let x = 0; x < 8; x++)loader.load("models/set2/pawn.json", (obj) => bornPiece(obj, 1, x, white)); //Peons blancs
    for(let x = 0; x < 8; x++)loader.load("models/set2/pawn.json", (obj) => bornPiece(obj, 6, x, black)); //Peons negres
    loader.load("models/set2/knight.json", (obj) => bornPiece(obj, 0, 1, white, "knight")); //Cavalls blancs
    loader.load("models/set2/knight.json", (obj) => bornPiece(obj, 0, 6, white, "knight")); //Cavalls blancs
    loader.load("models/set2/knight.json", (obj) => bornPiece(obj, 7, 1, black, "knight")); //Cavalls negres
    loader.load("models/set2/knight.json", (obj) => bornPiece(obj, 7, 6, black, "knight")); //Cavalls negres

    loader.load("models/set2/tower.json",  (obj) => bornPiece(obj, 0, 0, white)); //Torres blancs
    loader.load("models/set2/tower.json",  (obj) => bornPiece(obj, 0, 7, white)); //Torres blancs
    loader.load("models/set2/tower.json",  (obj) => bornPiece(obj, 7, 0, black)); //Torres negres
    loader.load("models/set2/tower.json",  (obj) => bornPiece(obj, 7, 7, black)); //Torres negres

    loader.load("models/set2/bishop.json", (obj) => bornPiece(obj, 0, 2, white)); //Alfils blancs
    loader.load("models/set2/bishop.json", (obj) => bornPiece(obj, 0, 5, white)); //Alfils blancs
    loader.load("models/set2/bishop.json", (obj) => bornPiece(obj, 7, 2, black)); //Alfils negres
    loader.load("models/set2/bishop.json", (obj) => bornPiece(obj, 7, 5, black)); //Alfils negres

    loader.load("models/set2/queen.json",  (obj) => bornPiece(obj, 0, 4, white)); //Reina blanc
    loader.load("models/set2/queen.json",  (obj) => bornPiece(obj, 7, 4, black)); //Reina negre
    loader.load("models/set2/king.json",   (obj) => bornPiece(obj, 0, 3, white)); //Reina blanc
    loader.load("models/set2/king.json",   (obj) => bornPiece(obj, 7, 3, black)); //Reina negre
}

function bornPiece(obj,z,x,color,raza = "default") {
    obj.name = z.toString() + x;
    obj.material.color = color;
    if(color.r == 0.2)obj.rotation.y = 85;
    obj.position.z = z;
    obj.position.x = x;        
    obj["tipo"] = "piece";
    obj["raza"] = raza;
    obj["subid"] = subid++;
    obj["nameColor"] = color.r == 1 ? "white" : "black"; // Pasem rbg a nom normal per fer la distincio;
    piecesOBJ[z][x] = obj;
    scene.add(obj);
}
function animate(){
    requestAnimationFrame(animate);  //Fa la funcio d'un setInterval   
    if(typeof(mv) === "object"){
        if(piecesOBJ[mv.y1][mv.x1].position.z < mv.y2)piecesOBJ[mv.y1][mv.x1].position.z = Math.round((piecesOBJ[mv.y1][mv.x1].position.z + 0.1) * 10) / 10;
        if(piecesOBJ[mv.y1][mv.x1].position.x < mv.x2)piecesOBJ[mv.y1][mv.x1].position.x = Math.round((piecesOBJ[mv.y1][mv.x1].position.x + 0.1) * 10) / 10;
        if(piecesOBJ[mv.y1][mv.x1].position.z > mv.y2)piecesOBJ[mv.y1][mv.x1].position.z = Math.round((piecesOBJ[mv.y1][mv.x1].position.z - 0.1) * 10) / 10;
        if(piecesOBJ[mv.y1][mv.x1].position.x > mv.x2)piecesOBJ[mv.y1][mv.x1].position.x = Math.round((piecesOBJ[mv.y1][mv.x1].position.x - 0.1) * 10) / 10;

        //Caballo Salto
        if(piecesOBJ[mv.y1][mv.x1].raza == "knight" && mv.horseUp){
            piecesOBJ[mv.y1][mv.x1].position.y += 0.5; // Pujada
            if(piecesOBJ[mv.y1][mv.x1].position.y >= 4)mv.horseUp = false; // Punt maxim i baixada
        }else if(piecesOBJ[mv.y1][mv.x1].raza == "knight" && piecesOBJ[mv.y1][mv.x1].position.y > 1) {
            piecesOBJ[mv.y1][mv.x1].position.y -= 0.5; // Baixada
        }
        //Enroque Corto
        if(enroqueC == 0){
            piecesOBJ[0][2].position.x = Math.round((piecesOBJ[0][2].position.x + 0.1) * 10) / 10;
            if(piecesOBJ[0][2].position.x == 2)enroqueC = 10;
        }
        if(enroqueC == 7){
            piecesOBJ[7][2].position.x = Math.round((piecesOBJ[7][2].position.x + 0.1) * 10) / 10;
            if(piecesOBJ[7][2].position.x == 2)enroqueC = 10;
        }

        //Enroque Largo
        if(enroqueL == 0){
            piecesOBJ[0][4].position.x = Math.round((piecesOBJ[0][4].position.x - 0.15) * 100) / 100;
            if(piecesOBJ[0][4].position.x == 4)enroqueL = 10;
        }

        if(enroqueL == 7){
            piecesOBJ[7][4].position.x = Math.round((piecesOBJ[7][4].position.x - 0.15) * 100) / 100;
            if(piecesOBJ[7][4].position.x == 4)enroqueL = 10;
        }

        //Animacion finaltzada
        if(piecesOBJ[mv.y1][mv.x1].position.z == mv.y2 && piecesOBJ[mv.y1][mv.x1].position.x == mv.x2){
            //Reposicionar
            piecesOBJ[mv.y2][mv.x2] = piecesOBJ[mv.y1][mv.x1];
            piecesOBJ[mv.y1][mv.x1] = 0;
            mv = 0;
            if(modo == "Spin"){
                for(let y in piecesOBJ){
                    for(let x in piecesOBJ){
                        if(piecesOBJ[y][x] != 0 && x < 7)piecesOBJ[y][x].position.x += 1;
                        if(piecesOBJ[y][x] != 0 && x == 7)piecesOBJ[y][x].position.x = 0;
                    }
                    piecesOBJ[y].unshift(piecesOBJ[y][piecesOBJ[y].length - 1]);
                    piecesOBJ[y].pop();
                }
                console.table(piecesOBJ);
            }
        }
    }
    renderer.render(scene, camera); //Renderitza l'escena a 60 frames 
}

//INIT ARRAY FUNCTION
function initArray(y,x){
    let tmp = new Array(y).fill(0);
    for(let j in tmp)tmp[j] = new Array(x).fill(0);
    return tmp;
}

//RAYCASTING
function onClick(event) {
    event.preventDefault();
	// calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    let canvas = document.querySelector("canvas");
    let formulaW = (window.innerWidth - canvas.width) / 2 / width;
    let formulaH = (window.innerHeight - canvas.height) / 2 / height; // No funciona
	mouse.x = (event.clientX  / width - formulaW) * 2 - 1;
    mouse.y = - (event.clientY / height) * 2 + 1;
    renderCasting();//RayCasting
}

function newLight(x,y,z, lateral = false, color = 0xffffff, int = 0.4) {
    //Llums !
    let spotLight = new THREE.SpotLight(color);
    let spotLightHelper = new THREE.SpotLightHelper(spotLight);
    spotLight.position.set(x,y,z);
    spotLight.penumbra = 0.5;
    spotLight.decay = 2;
    spotLight.intensity = int;
    spotLight.distance = 100;
    if(lateral)spotLight.lookAt(0,100,0);
    scene.add(spotLight);
    //scene.add(spotLightHelper);
}

function renderCasting() {
    raycaster.setFromCamera(mouse, camera); // update the picking ray with the camera and mouse position
    var intersects = raycaster.intersectObjects(scene.children);// calculate objects intersecting the picking ray
    for(let y of piecesOBJ)for(let x of y)if(x != 0)x.material.emissive.setHex(0x000000);
    if(intersects.length > 0){
        if(intersects[0].object.tipo == "piece"){    
            old = intersects[0].object;                    
            old.material.emissive.setHex(0x9900ff);  
        }
        if(intersects[0].object.tipo == "board" && old.position.x != intersects[0].object.position.x || old.position.z != intersects[0].object.position.z){
            socket.emit('test', {
                x1: old.position.x, 
                y1: old.position.z, 
                x2: intersects[0].object.position.x, 
                y2: intersects[0].object.position.z, 
                room: room,
                horseUp: true
            }); //Enviem les coordenades i color al servidor
            old.material.emissive.setHex(0x000000);
            old = null;
        }
    }
}

window.addEventListener('click', onClick, false);

function removePieces() {
    let removes = ["timer1", "timer2", "texto1", "texto2"];
    for(let p = 0; p < 32; p++){
        let tmp = scene.getObjectByProperty("subid",p);
        tmp.position.z = parseInt(tmp.name.split("")[0]);
        tmp.position.x = parseInt(tmp.name.split("")[1]);
    }
    for(let r of removes)scene.remove(scene.getObjectByName(r));
}

function loadTexts(info) {
    console.log("INFO:", info);
    var loader = new THREE.FontLoader();
    var material = new THREE.MeshBasicMaterial({color: "black"});

    loader.load( 'helvetiker_regular.typeface.json', (font) => {
        var geometry = new THREE.TextGeometry( `User${info.ids[0].slice(0,3)}`, {
            font: font,
            size: 1,
            height: 0.05,
            curveSegments: 20,
        });    
        var texto1 = new THREE.Mesh(geometry, material);
        texto1.position.set(0, -1, 10);
        texto1.rotateX(-60 * Math.PI / 180);
        texto1.name = "texto1";

        var geometry2 = new THREE.TextGeometry( `User${info.ids[1].slice(0,3)}`, {
            font: font,
            size: 1,
            height: 0.05,
            curveSegments: 20,
        });
        var texto2 = new THREE.Mesh(geometry2, material);
        texto2.position.set(5, -1, -3);
        texto2.rotateX(60 * Math.PI / 180);
        texto2.rotateY(180 * Math.PI / 180);
        texto2.name = "texto2";

        scene.add(texto1);
        scene.add(texto2);
    });

    loader.load( 'helvetiker_regular.typeface.json', (font) => {
        var geometry = new THREE.TextGeometry(toTimeSystem(info.time1), {
            font: font,
            size: 0.7,
            height: 0.02,
            curveSegments: 20,
        });    
        var timer1 = new THREE.Mesh(geometry, material);
        timer1.name = "timer1";
        timer1.position.set(-2, 0.5, 3);
        timer1.rotateX(-90 * Math.PI / 180);
        timer1.rotateY(30 * Math.PI / 180);
        timer1.rotateZ(90 * Math.PI / 180);

        var geometry2 = new THREE.TextGeometry(toTimeSystem(info.time2), {
            font: font,
            size: 0.7,
            height: 0.02,
            curveSegments: 20,
        });
        var timer2 = new THREE.Mesh(geometry2, material);
        timer2.name = "timer2";
        timer2.position.set(-2, 0.5, 6);
        timer2.rotateX(-90 * Math.PI / 180);
        timer2.rotateY(30 * Math.PI / 180);
        timer2.rotateZ(90 * Math.PI / 180);
        console.log(timer1);
        scene.add(timer1);
        scene.add(timer2);
    });

}

function loadTimers(info){    
    var loader = new THREE.FontLoader();
    loader.load( 'helvetiker_regular.typeface.json', (font) => {
        var geometry = new THREE.TextGeometry(toTimeSystem(info.time1), {
            font: font,
            size: 0.7,
            height: 0.02,
            curveSegments: 20,
        });    

        var geometry2 = new THREE.TextGeometry(toTimeSystem(info.time2), {
            font: font,
            size: 0.7,
            height: 0.02,
            curveSegments: 20,
        });    
        scene.getObjectByName("timer1").geometry = geometry;
        scene.getObjectByName("timer2").geometry = geometry2;
    })
}