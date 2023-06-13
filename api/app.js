'use strict'

var express = require('express');
var bodyParser = require('body-parser');

var cors = require('cors');
var app = express();
app.use(cors());

//cargar rutas
var user_routes = require('./routes/user');

//middlewares = metodo que se ejecuta antes de un controlador
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

//cors

//rutas
/*app.get('/', (req, res) => {
    res.status(200).send({
        message: 'Hola mundo desde NodeJS'
    })
})
//ruta de prueba
app.get('/pruebas', (req, res) => {
    res.status(200).send({
        message: 'Accion de pruebas en el servidor de NodeJS'
    })
})
//http://localhost:3800/pruebas
*/
app.use('/api', user_routes);

//exportar
module.exports = app;