'use strict'
var bcrypt = require('bcrypt-nodejs');
var mongoosePaginate = require('mongoose-pagination');
var fs = require('fs');
var path = require('path');

//Mayuscula indica modelo
var User = require('../models/user');
var jwt = require('../services/jwt');

//Metodos de prueba
//req = recibe
//res = respondra
function home(req, res)  {
    res.status(200).send({
        message: 'Hola mundo desde NodeJS'
    })
}

//Metodos de prueba
function pruebas(req, res)  {
    console.log(req.body);
    res.status(200).send({
        message: 'Accion de pruebas en el servidor de NodeJS'
    })
}

//Registro
function saveUser(req, res){
    //todos campos que lleguen por post
    var params = req.body;
    var user = new User();

    //Sino llega, si es true
    if(params.name && params.surname && params.nick && params.email && params.password){
        //Setear datos recibidos al modelo
        user.name = params.name;
        user.surname = params.surname;
        user.nick = params.nick;
        user.email = params.email;
        user.role = 'ROLE_USER';
        user.image = null;

        //Controlar usuarios duplicados
        User.find({ $or: [
            {email: user.email.toLowerCase()}, 
            {nick: user.nick.toLowerCase()}
        ]}).exec((err, users) => {
            if(err) return res.status(500).send({message: 'Error en la peticion de usuarios'});

            if(users && users.length >= 1){
                return res.status(200).send({message: 'El usuario que intentas registrar ya existe'});
            }else{

                //Cifra contraseña y guarda los datos
        bcrypt.hash(params.password, null, null, (err, hash) => {
            user.password = hash;

            //console.log(1);
            user.save((err, userStored) => {
                //console.log(2);
                if(err) return res.status(500).send({message: 'Error al guardar el usuario'});
                //console.log(3);
                if(userStored){
                    res.status(200).send({user: userStored});
                }else{
                    res.status(404).send({message: 'No se ha registrado el usuario'});
                }
            });
        });

            }
        });

        
    }else{
        res.status(200).send({
            message: 'Envia todos los campos, son necesarios.'
        });
    }
}

//Login
function loginUser(req, res){
    var params = req.body;
    var email = params.email;
    var password = params.password;

    //console.log(params)

    //Si lo que recibo esta en un doc
    User.findOne({email: email}, (err, user) => {
        if(err) return res.status(500).send({message: 'Error en la peticion'});

        if(user){
            //Password pasando es igual a la cifrada, entonces... el check
            bcrypt.compare(password, user.password, (err, check) => {
                if(check){
                    //Devolver datos de usuario
                    if(params.gettoken){
                        //generar y devolver token
                        return res.status(200).send({
                            token: jwt.createToken(user)
                        });
                    }else{
                        //devolver datos del usuario
                    user.password = undefined; //Elimina propiedad y no lo mandara en postman
                    return res.status(200).send({user})
                    }
                }else{
                    //Devolver error
                    return res.status(404).send({message: 'El usuario no se ha podido logear'});
                }
            });
        }else{
            return res.status(404).send({message: 'El usuario no se ha podido logear'});
        }
    });
}

//Conseguir datos de un usuario
function getUser(req, res){
    //post, put es body; por URL es params
    var userId = req.params.id;

    User.findById(userId, (err, user) => {
        if(err) return res.status(500).send({message: 'Error en la peticion'});

        if(!user) return res.status(404).send({message: 'El usuario no existe'});

        return res.status(200).send({user});
    });
}

//Devolver un listado de usuarios paginado //Recibir paginacion por url
function getUsers(req, res){
    //sub viene en payload en services jwt, aqui es el user logeado
    var identity_user_id = req.user.sub;
    
    //Parametro por default
    var page = 1;
    
    //Si llega este parametro page
    if(req.params.page){
        page = req.params.page;
    }

    //Usuarios por pagina, elementos
    var itemPerPage = 5;

    //Conseguir estos documentos y ordenarlos
    User.find().sort('_id').paginate(page, itemPerPage, (err, users, total) =>{
        if(err) return res.status(500).send({message: 'Error en la peticion'});

        if(!users) return res.status(404).send({message: 'No hay usuarios en la plataforma'});

        //Listas usuarios
        return res.status(200).send({
            users,
            total,
            pages: Math.ceil(total/itemPerPage)
        });
    });
}

//Edicion de datos de usuario
function updateUser(req, res){
    var userId = req.params.id;
    var update = req.body;

    //Borar propiedad password
    delete update.password;

    if(userId != req.user.sub){
        return res.status(500).send({message: 'No tienes permiso para actualizar los datos del usuario'});
    }

    //Verificar si ya existe apodo y no duplicarlo
    User.find({ $or: [
        {email: update.email.toLowerCase()}, 
        {nick: update.nick.toLowerCase()}
    ]}).exec((err, users)=>{ 
        //console.log(users);
        var user_isset = false;

        users.forEach((user) => {
            if(user && user._id != userId) user_isset = true;
        });

        //Variable si encuentra coincidencias no lo guardara, no se duplique
        if(user_isset) return res.status(404).send({message: 'Los datos ya estan en uso'});

        User.findByIdAndUpdate(userId, update, {new:true},  (err, userUpdated) =>{
            if(err) return res.status(500).send({message: 'Error en la peticion'});
    
            if(!userUpdated) return res.status(404).send({message: 'No se ha pidido actualizar el usuario'});
    
            return res.status(200).send({user: userUpdated});
        });

    }) ;

}

//Subir imagen/avatar de usuario
function uploadImage(req, res){
    //Es el id del usuario
    var userId = req.params.id;

    //Abra un array, si se manda un fichero
    /*if(req.files){
        var file_path = req.files.imagen.path;
        //console.log(file_path);
        
        var file_split = file_path.split('\\');
        //console.log(file_split);

        //Obtener el nombre del archivo
        var file_name = file_split[2];
        //console.log(file_name);

        //En postman en headers marcar el content-type
        var ext_split = file_name.split('\.');
        //console.log(ext_split);
        
        //Indice uno es la extension del archivo
        var file_ext = ext_split[1];
        //console.log(file_ext);

            //Solo el usuario subira fotos de su cuenta, autenticado con el sub del payload
    if(userId != req.user.sub){
        return removeFilesOfUploads(res, file_path, 'No tienes permiso para actualizar los datos del usuario');
    }


        //Extensiones correctas
        if(file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif'){
            //Actualizar documento de usuario logeado
            User.findByIdAndUpdate(userId, {image: file_name}, {new: true}, (err, userUpdated) =>{

                if(err) return res.status(500).send({message: 'Error en la peticion'});

                if(!userUpdated) return res.status(404).send({message: 'No se ha pidido actualizar el usuario'});
        
                return res.status(200).send({user: userUpdated});
            

            });
        } else {
            //Extension mala
            return removeFilesOfUploads(res, file_path, 'Extension no valida');
        }
    }else{
        return res.status(200).send({message: 'No se ha subido archivos/imagen'});
    }*/
    if(req.file){

        // console.log(req.file);
    
        var file_path = req.file.path;
    
        var file_split = file_path.split('\\');
    
        var file_name = file_split[2];
    
        var ext_split = req.file.originalname.split('\.');
    
        var file_ext = ext_split[1]
    
        if(file_ext== 'png' || file_ext== 'gif' || file_ext== 'jpg'){
    
          User.findByIdAndUpdate(userId, {image:file_name}, (err, userUpdated) => {
    
            if(!userUpdated){
    
              res.status(404).send({message: 'No se ha podido actualizar el album'});
    
            }else{
    
              res.status(200).send({user: userUpdated});
    
            }
    
          })
    
        }else{
    
          res.status(200).send({message: 'Extension del archivo no valida'});
    
        }
    
        console.log(file_path);
    
      }else{
    
        res.status(200).send({message: 'No has subido ninguna imagen..'});
    
      }
}

function removeFilesOfUploads(res, file_path, message){
    fs.unlink(file_path, (err) => {
        return res.status(200).send({message: message});
    });
}

//Devolver imagen de usuario
function getImageFile(req, res){
    //Nombre del fichero
    var image_file = req.params.imageFile;

    var path_file = './uploads/users/'+image_file;

    fs.exists(path_file, (exists) => {
        if(exists){
            res.sendFile(path.resolve(path_file));
        } else{
            res.status(200).send({message: 'No existe la imagen'});
        }

    });
}

//Exportar lo metodos
module.exports = {
    home,
    pruebas,
    saveUser,
    loginUser,
    getUser,
    getUsers,
    updateUser,
    uploadImage,
    getImageFile
}