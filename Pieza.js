class Pieza {
    constructor(id, coord, url, tipus, color){
        this.id = id;
        this.color = color;
        this.url = "img/" + url; //Imatge
        this.tipus = tipus; //Peon, torre, reina, etc...
        this.coord = coord;
        this.used = false; //nomes per Torres
    }
}