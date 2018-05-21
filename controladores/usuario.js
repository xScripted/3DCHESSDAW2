const passport = require('passport');
const Usuario = require('C:/Users/Work/Desktop/ProjecteFinal/3DCHESSDAW2/models/Usuario');

exports.postSignup = (req, res, next) => {
    const nuevoUsuario = new Usuario({
        email: req.body.email,
        password: req.body.password,
        nick: req.body.nick,
        nombre: req.body.nombre
    })
    Usuario.findOne({nick: req.body.nick}, (err, usuarioExistente) => {
        if(usuarioExistente){
            return res.status(400).send('Ya existe este usuario');
        }
        console.log("AQUI",req.body);
        nuevoUsuario.save((err) => {
            if(err){
                next(err);
            }
            req.logIn(nuevoUsuario, (err) => {
                if (err) {
                    next(err);
                }
                res.sendFile('C:/Users/Work/Desktop/ProjecteFinal/3DCHESSDAW2/public/chess.html');
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
            res.sendFile('C:/Users/Work/Desktop/ProjecteFinal/3DCHESSDAW2/public/chess.html');
        })
    })(req, res, next);
}

exports.logout = (req, res) => {
    req.logout();
    res.send("Hasta pronto ! ");
}