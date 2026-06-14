import {Router} from 'express'
import { verAula, listarAulas, listarOficinas, verOficina,listarEventos,verEvento, listarDocentes, verDocente } from '../controllers/admin_controllers.js'
import { actualizarPasswordEstudiante, actualizarPerfilEstudiante, comprobarTokenPasswordEstudiante, crearNuevoPasswordEstudiante, loginEstudiante, perfilEstudiante, recuperarPasswordEstudiante, registroEstudiante } from '../controllers/estudiante_controllers.js'
import { verificarTokenJWT } from '../middlewares/JWT.js'
import { validarRegistroEstudiante, validarMiddleware } from '../middlewares/validators.js'


const router = Router()

//REGISTRO Y AUTENTICACIÓN
router.post('/estudiantes/registro', validarMiddleware(validarRegistroEstudiante), registroEstudiante)
router.post('/recuperarpassword',recuperarPasswordEstudiante)
router.post('/estudiantes/recuperar-password',recuperarPasswordEstudiante)
router.get('/recuperarpassword/:token',comprobarTokenPasswordEstudiante)  
router.post('/nuevopassword/:token',crearNuevoPasswordEstudiante)


//AUTENTICACIÓN
router.post('/estudiantes/login',loginEstudiante) 
router.get('/perfil',verificarTokenJWT,perfilEstudiante)
router.put('/actualizarperfil/:id',verificarTokenJWT,actualizarPerfilEstudiante)
router.put('/actualizarpassword/:id',verificarTokenJWT,actualizarPasswordEstudiante)

//EVENTOS
router.get('/eventos',listarEventos)
router.get('/verevento/:id',verEvento)

//OFICINAS

router.get('/oficinas',listarOficinas)
router.get('/veroficina/:id',verOficina)



//AULAS
router.get('/aulas',listarAulas)
router.get('/veraula/:id',verAula)


//DOCENTES
router.get('/docentes',listarDocentes)
router.get('/verdocente/:id',verDocente)


export default router