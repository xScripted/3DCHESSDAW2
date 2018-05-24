const passport = require('passport');
const Usuario = require('/home/miquel/Escritorio/aje3d/3DCHESSDAW2/models/Usuario');
const mongoose = require('mongoose');
const MONGO_URL = "mongodb://localhost:27017/auth";

exports.postSignup = (req, res, next) => {
    const nuevoUsuario = new Usuario({
        email: req.body.email,
        password: req.body.password,
        nick: req.body.nick,
        nombre: req.body.nombre,
        elo: 1000
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
                res.sendFile('/home/miquel/Escritorio/aje3d/3DCHESSDAW2/public/chess.html');
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
            res.sendFile('/home/miquel/Escritorio/aje3d/3DCHESSDAW2/public/chess.html');
        })
    })(req, res, next);
}


exports.logout = (req, res) => {
    req.logout();
    res.send("Hasta pronto ! ");
}