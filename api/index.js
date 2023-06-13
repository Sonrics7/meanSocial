'use strict'

var mongoose = require('mongoose');
//Aqui abajo esta express
var app = require('./app');
var port = 3800;

//Promesas - Conexion DB
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/meanSocial', { useNewUrlParser: true })
    .then(() => {
        console.log("++La conexion correcta");

        //Crear servidor
        app.listen(port, () => {
            console.log("Servidor corriendo en localhost:3800");
        });
    })
    .catch(err => console.log(err));
