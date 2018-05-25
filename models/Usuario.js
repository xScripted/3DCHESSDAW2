const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');
const Schema = mongoose.Schema;

const usuarioSchema = new Schema({
    email:    {type: String, unique: true, lowercase: true},
    password: {type: String, required: true},
    nick:     {type: String, required: true, unique: true},
    nombre:   {type: String},
    foto:     {type: String},
    elo:      {type: Number},
    victorias:{type: Number},
    derrotas: {type: Number},
    empates:  {type: Number},
    games:    {type: Number},
    time:     {type: Number},
}, {
    timestamps: true //Indica cuando fue creado
})

usuarioSchema.pre('save', function(next){
    const usuario = this;
    if(!usuario.isModified('password')) {
        return next();
    }

    bcrypt.genSalt(10, (err, salt) => {
        if(err){
            next(err);
        }
        bcrypt.hash(usuario.password, salt, null, (err, hash) => {
            if(err){
                next(err);
            }
            usuario.password = hash;
            next();
        })
    })
})

usuarioSchema.methods.compararPassword = function(password, cb) {
    bcrypt.compare(password, this.password, (err, sonIguales) => {
        if(err){
            cb(err);
        }
        cb(null, sonIguales);
    })
}

module.exports = mongoose.model('Usuario', usuarioSchema);