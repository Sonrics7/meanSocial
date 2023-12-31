'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var secret = 'clave_secreta_mean';

exports.createToken = function(user){
    var payload = {
        sub: user._id,
        name: user.name,
        surname: user.surname,
        nick: user.nick,
        email: user.email,
        role: user.role,
        image: user.image,
        //Fecha de creacion
        iat: moment().unix(),
        //Fecha de expiracion
        exp: moment().add(30, 'days').unix
    };
    return jwt.encode(payload, secret);
};