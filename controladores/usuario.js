const passport = require('passport');
const Usuario = require('../models/Usuario');

exports.postSignup = (req, res, next) => {
    const nuevoUsuario = new Usuario({
        io: "nothing",
        email: req.body.email,
        password: req.body.password,
        nick: req.body.nick,
        nombre: req.body.nombre,
        elo: 1000,
        victorias: 0,
        derrotas:  0,
        empates:   0,
        games:     0,
        time:      0
    })
    Usuario.findOne({nick: req.body.nick}, (err, usuarioExistente) => {
        if(usuarioExistente){
            return res.status(400).send('Ya existe este usuario');
        }
        nuevoUsuario.save((err) => {
            if(err){
                next(err);
            }
            req.logIn(nuevoUsuario, (err) => {
                if (err) {
                    next(err);
                }
                next();
            });
        })
    })
}

exports.postLogin = (req, res, next) => {
    passport.authenticate('local', (err, usuario, info) => {
        if(err){
            next(err);
        }
        if(!usuario){
            return res.status(400).send("Nick o password no validos");
        }
        req.logIn(usuario, (err) => {  
            if (err){
                next(err);
            }          
            next();        
        })
    })(req, res, next);
}


exports.logout = (req, res) => {
    req.logout();
    res.render('C:/Users/Work/Desktop/ProjecteFinal/3DCHESSDAW2/public/views/index.ejs');
}