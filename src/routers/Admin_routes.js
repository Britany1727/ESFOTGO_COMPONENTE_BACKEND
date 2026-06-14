
import {Router} from 'express'

import { actualizarAula, actualizarEvento, actualizarOficina, actualizarPasswordAdmin, actualizarPerfilAdmin, buscarDocente, buscarEstudiante, comprobarTokenPasswordAdmin, crearAulas, crearEvento, crearNuevoPasswordAdmin, crearOficinas, eliminarAula, eliminarDocente, eliminarEstudiante, eliminarEvento, eliminarOficina, listarAulas, listarDocentes, listarEstudiantes, listarEventos, listarOficinas, loginAdmin, perfilAdmin, recuperarPasswordAdmin, registroAdmin, verAula, verDocente, verEstudiante, verEvento, verOficina, crearEstudianteAdmin, crearDocenteAdmin } from '../controllers/admin_controllers.js'
import { verificarTokenJWT } from '../middlewares/JWT.js'
import { validarEvento, validarAula, validarMiddleware } from '../middlewares/validators.js'
import { uploadExcel } from '../controllers/upload_controllers.js'
import { actualizarPerfilDocente } from '../controllers/docente_controllers.js'
import { actualizarPerfilEstudiante } from '../controllers/estudiante_controllers.js'
import { subirFotoPanoramica } from '../controllers/mapa_controllers.js';




const routerAdmins= Router()

//REGISTRO Y AUTENTICACIÓN
routerAdmins.post('/admin/registro',registroAdmin)
routerAdmins.post('/admin/recuperarpassword',recuperarPasswordAdmin)
routerAdmins.get('/admin/recuperarpassword/:token',comprobarTokenPasswordAdmin)  
routerAdmins.post('/admin/nuevopassword/:token',crearNuevoPasswordAdmin)
//AUTENT
routerAdmins.post('/admin/login',loginAdmin) 
routerAdmins.get('/admin/perfil',verificarTokenJWT,perfilAdmin)
routerAdmins.put('/admin/actualizarperfil/:id',verificarTokenJWT,actualizarPerfilAdmin)
routerAdmins.put('/admin/actualizarpassword/:id',verificarTokenJWT,actualizarPasswordAdmin)

//EVENTOS
routerAdmins.post('/admin/evento', validarMiddleware(validarEvento), crearEvento)
routerAdmins.put('/admin/actualizarevento/:id',actualizarEvento)
routerAdmins.delete('/admin/eliminarevento/:id',eliminarEvento)
routerAdmins.get('/eventos',listarEventos)
routerAdmins.get('/verevento/:id',verificarTokenJWT,verEvento)


//OFICINAS
routerAdmins.post('/admin/oficina',verificarTokenJWT,crearOficinas)
routerAdmins.get('/oficinas',verificarTokenJWT,listarOficinas)
routerAdmins.get('/veroficina/:id',verificarTokenJWT,verOficina)
routerAdmins.put('/admin/actualizaroficina/:id',verificarTokenJWT,actualizarOficina)
routerAdmins.delete('/admin/eliminaroficina/:id',verificarTokenJWT,eliminarOficina)
routerAdmins.get('/admin/oficinas',listarOficinas)
//AULAS
routerAdmins.post('/admin/aula', verificarTokenJWT, validarMiddleware(validarAula), crearAulas)
routerAdmins.get('/aulas',verificarTokenJWT,listarAulas)
routerAdmins.get('/veraula/:id',verificarTokenJWT,verAula)
routerAdmins.put('/admin/actualizaraula/:id',verificarTokenJWT,actualizarAula)
routerAdmins.delete('/admin/eliminaraula/:id',verificarTokenJWT,eliminarAula)
routerAdmins.get('/aulas',listarAulas)

//ESTUDIANTES
routerAdmins.get('/buscarEstudiante',buscarEstudiante)
routerAdmins.get('/estudiantes',listarEstudiantes)
routerAdmins.get('/verestudiante/:id',verificarTokenJWT,verEstudiante)
routerAdmins.delete('/eliminarestudiante/:id',verificarTokenJWT,eliminarEstudiante)
routerAdmins.delete('/admin/eliminarestudiante/:id',verificarTokenJWT,eliminarEstudiante)
routerAdmins.put('/actualizarEstudiante/:id',verificarTokenJWT,actualizarPerfilEstudiante)
routerAdmins.put('/admin/actualizarEstudiante/:id',verificarTokenJWT,actualizarPerfilEstudiante)
routerAdmins.post('/admin/crearEstudiante',verificarTokenJWT,crearEstudianteAdmin)


//DOCENTES
routerAdmins.get('/buscarDocente',buscarDocente)
routerAdmins.get('/docentes',verificarTokenJWT,listarDocentes)
routerAdmins.get('/verdocente/:id',verificarTokenJWT,verDocente)
routerAdmins.delete('/eliminardocente/:id',verificarTokenJWT,eliminarDocente)
routerAdmins.delete('/admin/eliminardocente/:id',verificarTokenJWT,eliminarDocente)
routerAdmins.put('/actualizarDocente/:id',verificarTokenJWT,actualizarPerfilDocente)
routerAdmins.put('/admin/actualizardocente/:id',verificarTokenJWT,actualizarPerfilDocente)
routerAdmins.post('/admin/crearDocente',verificarTokenJWT,crearDocenteAdmin)
//CARGA MASIVA DE DOCENTES Y ESTUDIANTESs
routerAdmins.post('/admin/upload',verificarTokenJWT,uploadExcel)


//MAPA
routerAdmins.post('/admin/subirfotopanoramica/:id',verificarTokenJWT,subirFotoPanoramica)

export default routerAdmins