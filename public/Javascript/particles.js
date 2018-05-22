const cantidad = 200;
for(let k = 0; k < cantidad; k++)createParticle();
function createParticle() {
    let p = document.createElement("div");
    let img = Math.floor(Math.random() * 5);
    let wix = Math.random() * particles.clientWidth;
    let vel = Math.random() * 50 + 20;
    let tam = (Math.random() * 50 + 40) + "px";
    p.style.width  = tam;
    p.style.height = tam;
    p.style.position = "absolute";
    p.style.background = `url(../img/index/${img}.png)`;
    p.style.backgroundSize = "100%";
    p.style.opacity = 0.8;
    p.style.marginTop = `${particles.clientHeight}px`;
    p.style.marginLeft = `${wix}px`;    
    particles.appendChild(p);
    TweenMax.to(p, vel, {
        marginTop:"-300px",
        opacity: 0,
        rotationX: Math.random() * 900 + 50,
        rotationZ: Math.random() * 900 + 50,
        delay: Math.random() * 100,
        repeat: -1
    })
}