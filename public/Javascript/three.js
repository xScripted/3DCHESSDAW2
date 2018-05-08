//////////////////////
//// Miquel Toran ////
//////////////////////

//Variables Globals !
var width, height;
var scene, camera, renderer;
var boardOBJ = initArray(8,8);
var piecesOBJ = initArray(8,8);
var color1 = "#FFEEC7", color2 = "#FFB300";
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2(), old;
var texture = new THREE.TextureLoader().load('img/wood5.png');//Textura
var mv;

// MAIN
window.onload = () => {
    client();
    init();
}

//Socket IO
socket.on('testReturned', (returned) => {            
    if(returned.move){
        mv = returned.mv;
    }            
})

socket.on('newGame', (ids) => {
    reloadPieces();
    room = ids[0]; //Guardem en quina room esta       
    chess.style.display = 'block'; 
    multiplayer.style.display = 'none';
    if(j1){
        loadNames(ids);
    } else {
        loadNames(ids);
    }
})
//////////////////////////////////////////////////////////////////////////////////////////////////

function init() {
    //Obtenim les dimensions del contenidor tablero3D
    width  = board3D.clientWidth;
    height = board3D.clientHeight;

    //Iniciem variables base
    scene = new THREE.Scene();//         FOV  ASPECT RATIO                           NEAR FAR
    camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(width, height);


    //PRUEBAS BACKGROUND
    // instantiate a loader
    var bgimg = new THREE.ImageLoader();

    /* load a image resource
    bgimg.load(
        // resource URL
        'img/bg1.jpg',

        // onLoad callback
        function ( image ) {
            // use the image, e.g. draw part of it on a canvas
            var canvas = document.createElement( 'canvas' );
            var context = canvas.getContext( '2d' );
            context.drawImage( image, 100, 100 );
        },

        // onProgress callback currently not supported
        undefined,

        // onError callback
        function () {
            console.error( 'An error happened.' );
        }
    );

    ///////////////////////////*/

    //Llums !
    scene.background = new THREE.Color(bgimg); //BackgroundColor
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
    var material = new THREE.MeshPhysicalMaterial({color: "#805900", dithering: true, map: texture});
    var border = new THREE.BoxGeometry(10, 0.5, 1); 
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
    obj.material.color = color;
    if(color.r == 0.2)obj.rotation.y = 85;
    obj.position.z = z;
    obj.position.x = x;
    obj["tipo"] = "piece";
    obj["raza"] = raza;
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

        //Cavall Salt
        if(piecesOBJ[mv.y1][mv.x1].raza == "knight" && mv.horseUp){
            piecesOBJ[mv.y1][mv.x1].position.y += 0.5; // Pujada
            if(piecesOBJ[mv.y1][mv.x1].position.y >= 4)mv.horseUp = false; // Punt maxim i baixada
        }else if(piecesOBJ[mv.y1][mv.x1].raza == "knight" && piecesOBJ[mv.y1][mv.x1].position.y > 1) {
            piecesOBJ[mv.y1][mv.x1].position.y -= 0.5; // Baixada
        }

        //Animacio finalitzada
        if(piecesOBJ[mv.y1][mv.x1].position.z == mv.y2 && piecesOBJ[mv.y1][mv.x1].position.x == mv.x2){
            console.log(piecesOBJ[mv.y1][mv.x1].position);
            //Reposicionar
            piecesOBJ[mv.y2][mv.x2] = piecesOBJ[mv.y1][mv.x1];
            piecesOBJ[mv.y1][mv.x1] = 0;
            mv = 0;
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

function reloadPieces() {

}

function loadNames(ids) {
    var loader = new THREE.FontLoader();
    var material = new THREE.MeshBasicMaterial({color: "black"});

    loader.load( 'helvetiker_regular.typeface.json', (font) => {
        var geometry = new THREE.TextGeometry( `User${ids[0].slice(0,3)}`, {
            font: font,
            size: 1,
            height: 0.1,
            curveSegments: 20,
        });    
        var texto1 = new THREE.Mesh(geometry, material);
        texto1.position.set(0, -0.5, 10);
        texto1.rotateX(-90 * Math.PI / 180);

        var geometry2 = new THREE.TextGeometry( `User${ids[1].slice(0,3)}`, {
            font: font,
            size: 1,
            height: 0.1,
            curveSegments: 20,
        });
        var texto2 = new THREE.Mesh(geometry2, material);
        texto2.position.set(5, -0.5, -3);
        texto2.rotateX(90 * Math.PI / 180);
        texto2.rotateY(180 * Math.PI / 180);

        scene.add(texto1);
        scene.add(texto2);
    });
}