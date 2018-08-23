const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const Usuario = require('../models/Usuario');

passport.serializeUser((usuario, done) => {
    done(null, usuario._id);
})

passport.deserializeUser((id, done) => {
    Usuario.findById(id, (err, usuario) => {
        done(err, usuario);
    })
})

passport.use(new LocalStrategy({usernameField: 'nick'}, (nick, password, done) => {
    Usuario.findOne({nick}, (err, usuario) => {
        if(!usuario){
            return done(null, false, {message: 'Este usuario no existe'});
        } else {
            usuario.compararPassword(password, (err, sonIguales) => {
                if(sonIguales){
                    return done(null, usuario);
                } else {
                    return done(null, false, {message: 'Password incorrecta'});
                }
            })
        }
    })
}))

exports.estaAutenticado = (req, res, next) => {
    if(req.isAuthenticated()) {
        return next();
    }
    res.status(401).send('No tienes permisos');
}