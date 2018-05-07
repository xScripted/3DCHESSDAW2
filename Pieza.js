class Pieza {
    constructor(id, coord, url, tipo, color){
        this.id = id;
        this.color = color;
        this.url = "img/" + url; //Imagen
        this.tipo = tipo; //Peon, torre, reina, etc...
        this.coord = coord;
        this.viva = true;
        this.used = false; // Solo para torres
    }
}