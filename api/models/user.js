'use strict'

var mongoose = require('mongoose');
//Para que mongoo user el esquema
var Schema = mongoose.Schema;

//Esto es del diagrama, entidad pa crear objetos de este modelo
var UserSchema = Schema({
    name: String,
    surname: String,
    nick: String,
    email: String,
    password: String,
    role: String,
    image: String
});

//Modelo user y otro esquema de estos campos
// de User, lo guardara como users
module.exports = mongoose.model('User', UserSchema);