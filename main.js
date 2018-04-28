//////////////////////
//// Miquel Toran ////
//////////////////////

//Variables Globals
var width, height;
var scene, camera, renderer;
var taulerOBJ = initArray(8,8);
var color1 = "white", color2 = "gray";
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2(), INTERSECTED;

// MAIN
window.onload = () => {
    init();
    animar();
}


function init() {
    //Obtenim les dimensions del contenidor tablero3D
    width = tauler3D.clientWidth;
    height = tauler3D.clientHeight;

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

    generarPiezas();

    //L'afegim al Div contenidor
    tauler3D.appendChild(renderer.domElement);
    
    generarTauler();
}

function generarTauler(){
    for(let y = 0; y < 8; y++)for(let x = 0; x < 8; x++)taulerOBJ[y][x] = generarCasilla(y,x);
}

function generarCasilla(y,x){
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

    scene.add(cube);
    
    return cube;
}

function generarPiezas() {
    var loader = new THREE.FileLoader();
    loader.load("img/chess-horse.json", (geometry) => {
        var t = new THREE.Geometry();
        console.log(t.toJSON(), geometry);
        var material = new THREE.MeshPhysicalMaterial({color: "red"});
        var cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
    })
}
function animar(){
    requestAnimationFrame(animar);  //Fa la funcio d'un setInterval

    //Renderitza l'escena a 60 frames 
    renderer.render(scene, camera);
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
	// update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);
    
	// calculate objects intersecting the picking ray
	var intersects = raycaster.intersectObjects(scene.children);
    if(intersects.length > 0) {
        if(INTERSECTED != intersects[0].object ) {        
            if(INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
            INTERSECTED = intersects[0].object;
            INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
            INTERSECTED.material.emissive.setHex(0xff0000);
        }
    } else {
        if(INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
        INTERSECTED = null;
    }
}

window.addEventListener('click', onClick, false);