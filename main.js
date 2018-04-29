//////////////////////
//// Miquel Toran ////
//////////////////////

//Variables Globals
var width, height;
var scene, camera, renderer;
var boardOBJ = initArray(8,8);
var piecesOBJ = initArray(8,8);
var color1 = "white", color2 = "gray";
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2(), OLD;

// MAIN
window.onload = () => {
    init();
    animate();
}

function init() {
    //Obtenim les dimensions del contenidor tablero3D
    width = board3D.clientWidth;
    height = board3D.clientHeight;

    //Iniciem variables base
    scene = new THREE.Scene();//         FOV  ASPECT RATIO   NEAR FAR
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);

    //Llums !
    var light = new THREE.AmbientLight("white"); // soft white light
    var directionalLight = new THREE.DirectionalLight("gray");
    directionalLight.position.set(0, 0, 5).normalize();
    scene.background = new THREE.Color("gray"); //BackgroundColor
    scene.add(directionalLight);
    scene.add(light);
    
    //*// CONTROL DE CAMARA
    camera.position.x = 0;
    camera.position.y = 5;
    camera.position.z = 10;

    let controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(4, 0, 4);
    controls.addEventListener('change',renderer);
    controls.minDistance = 0;
    controls.maxDistance = 500;
    controls.enablePan = false;
    controls.autoRotate = true;
    ////////////////////////////////*/

    //L'afegim al Div contenidor
    board3D.appendChild(renderer.domElement);
    
    newBoard();
}

function newBoard(){
    for(let y = 0; y < 8; y++)for(let x = 0; x < 8; x++)boardOBJ[y][x] = genSquare(y,x);
    genPieces();
}

function genSquare(y,x){
    //Textura
    var texture = new THREE.TextureLoader().load('img/wood.png');
    //Tamany
    var geometry = new THREE.BoxGeometry(1, 1, 1);
    //Colors alternatius
    var color = (x % 2 == 0 && y % 2 == 0) || (x % 2 != 0 && y % 2 != 0) ? color1 : color2;
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
    let black = {r: 0, g: 0, b:0}
    var loader = new THREE.ObjectLoader();
    for(let x = 0; x < 8; x++)loader.load("models/set2/pawn.json", (obj) => bornPiece(obj, 1, x, white)); //Peons blancs
    for(let x = 0; x < 8; x++)loader.load("models/set2/pawn.json", (obj) => bornPiece(obj, 6, x, black)); //Peons blancs
}
function bornPiece(obj,z,x,color) {
    obj.material.color = color;
    obj.position.z = z;
    obj.position.x = x;
    obj["tipo"] = "piece";
    piecesOBJ[z][x] = scene.add(obj);
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
	mouse.x = (event.clientX  / width - formulaW) * 2 - 1;
    mouse.y = - (event.clientY / height) * 2 + 1;
    //console.log(mouse);
    renderCasting();//RayCasting
}

function renderCasting() {
    raycaster.setFromCamera(mouse, camera); // update the picking ray with the camera and mouse position
    var intersects = raycaster.intersectObjects(scene.children);// calculate objects intersecting the picking ray
    if(intersects[0].object.tipo == "piece"){
        old = intersects[0].object;        
        old.material.emissive.setHex(0xff0000);
    }
    if(intersects[0].object.tipo == "board"){
        old.material.emissive.setHex(0x000000);
        old.position.x = intersects[0].object.position.x;
        old.position.z = intersects[0].object.position.z;
        old = null;
    }
    /*if(intersects.length > 0) {
        if(INTERSECTED != intersects[0].object) {        
            if(INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
            INTERSECTED = intersects[0].object;
            INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
            INTERSECTED.material.emissive.setHex(0xff0000);
        }
    } else {
        if(INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
        INTERSECTED = null;
    }*/
}

window.addEventListener('click', onClick, false);