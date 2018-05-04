//////////////////////
//// Miquel Toran ////
//////////////////////

//Variables Globals !
var width, height;
var scene, camera, renderer;
var boardOBJ = initArray(8,8);
var piecesOBJ = initArray(8,8);
var color1 = "white", color2 = "gray";
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2(), old;

// MAIN
window.onload = () => {
    client();
    init();
}

function init() {
    //Obtenim les dimensions del contenidor tablero3D
    width  = board3D.clientWidth;
    height = board3D.clientHeight;

    //Iniciem variables base
    scene = new THREE.Scene();//         FOV  ASPECT RATIO                           NEAR FAR
    camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(width, height);

    //Llums !
    scene.background = new THREE.Color(threebg); //BackgroundColor
    var light = new THREE.AmbientLight("white"); // soft white light
    var spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set( 15, 20, 35 );
    spotLight.angle = Math.PI / 4;
    spotLight.penumbra = 0.05;
    spotLight.decay = 2;
    spotLight.distance = 100;
    scene.add(spotLight);
    scene.add(light);
    
    //*// CONTROL DE CAMARA
    camera.position.x = 10;
    camera.position.y = 5;
    camera.position.z = 10;

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
    var material = new THREE.MeshPhysicalMaterial({color: "gray", dithering: true});
    var border = new THREE.BoxGeometry(10, 0.5, 1); 
    var border1 = new THREE.Mesh(border, material);
    var border2 = new THREE.Mesh(border, material);
    var border3 = new THREE.Mesh(border, material);
    var border4 = new THREE.Mesh(border, material);

    border1.position.x = 3.5;
    border1.position.z = -1;

    border2.position.x = 3.5;
    border2.position.z = 8;

    border3.position.x = 8;
    border3.position.z = 3.5;
    border3.rotation.y = 1.57;

    border4.position.x = -1;
    border4.position.z = 3.5;
    border4.rotation.y = 1.57;

    scene.add(border1);  
    scene.add(border2); 
    scene.add(border3);  
    scene.add(border4); 

    for(let y = 0; y < 8; y++)for(let x = 0; x < 8; x++)boardOBJ[y][x] = genSquare(y,x); //Tauler
    genPieces();  
}


function genSquare(y,x){
    var texture = new THREE.TextureLoader().load('img/wood.png');//Textura
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
    loader.load("models/set2/knight.json", (obj) => bornPiece(obj, 0, 1, white)); //Cavalls blancs
    loader.load("models/set2/knight.json", (obj) => bornPiece(obj, 0, 6, white)); //Cavalls blancs
    loader.load("models/set2/knight.json", (obj) => bornPiece(obj, 7, 1, black)); //Cavalls negres
    loader.load("models/set2/knight.json", (obj) => bornPiece(obj, 7, 6, black)); //Cavalls negres

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
function bornPiece(obj,z,x,color) {
    obj.material.color = color;
    if(color.r == 0.2)obj.rotation.y = 85;
    obj.position.z = z;
    obj.position.x = x;
    obj["tipo"] = "piece";
    obj["nameColor"] = color.r == 1 ? "white" : "black"; // Pasem rbg a nom normal per fer la distincio;
    piecesOBJ[z][x] = obj;
    scene.add(obj);
}
function animate(){
    requestAnimationFrame(animate);  //Fa la funcio d'un setInterval
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
    mouse.y = - (event.clientY / height) * 2 + 1.17;
    renderCasting();//RayCasting
}
function renderCasting() {
    raycaster.setFromCamera(mouse, camera); // update the picking ray with the camera and mouse position
    var intersects = raycaster.intersectObjects(scene.children);// calculate objects intersecting the picking ray
    if(intersects.length > 0){
        if(intersects[0].object.tipo == "piece"){    
            old = intersects[0].object;        
            old.material.emissive.setHex(0xff0000);
        }
        if(intersects[0].object.tipo == "board"){
            socket.emit('test', {
                x1: old.position.x, 
                y1: old.position.z, 
                x2:intersects[0].object.position.x, 
                y2: intersects[0].object.position.z, 
                room: room
            }); //Enviem les coordenades i color al servidor
            socket.on('testReturned', (returned) => {
                if(returned.move){
                    piecesOBJ[returned.mv.y1][returned.mv.x1].position.x = returned.mv.x2;
                    piecesOBJ[returned.mv.y1][returned.mv.x1].position.z = returned.mv.y2;
                    piecesOBJ[returned.mv.y2][returned.mv.x2] = piecesOBJ[returned.mv.y1][returned.mv.x1];
                    piecesOBJ[returned.mv.y1][returned.mv.x1] = 0;
                }
                console.log("Estupendo !", returned);
            })
            old.material.emissive.setHex(0x000000);
            //old.position.x = intersects[0].object.position.x;
            //old.position.z = intersects[0].object.position.z;
            old = null;
        }
    }
}

window.addEventListener('click', onClick, false);

function reloadPieces() {
    for(let z = 0; z < 8; z++) {
        for(let x = 0; x < 8; x++){
            if(piecesOBJ[z][x] != 0){
                piecesOBJ[z][x].position.x = x;
                piecesOBJ[z][x].position.z = z;
            }
        }
    }
}