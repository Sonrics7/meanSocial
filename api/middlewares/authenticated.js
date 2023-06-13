'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var secret = 'clave_secreta_mean';

//req= recibimos, res : respuesta, next lo que permite saltar, sin next
//no sale del middleware
exports.ensureAuth = function(req, res, next){
    if(!req.headers.authorization){
        return res.status(403).send({message: 'La peticion no tiene la cabecera de autenticacion'});
    }
    //Remplazar comillas por nada, expresion regular
    var token = req.headers.authorization.replace(/['"]+/g, '');

    try{
    //Decodificar el payload que tiene todos los datos
        var payload = jwt.decode(token, secret);
        if(payload.exp <= moment().unix()){
            return res.status(401).send({message: 'El token ha expirado'});
        }
    }catch(ex){
        return res.status(404).send({message: 'El token no es valido'});
    }
    //Adjuntar payload a req siempre el usuario logeado
    req.user = payload;
    
    next();
}