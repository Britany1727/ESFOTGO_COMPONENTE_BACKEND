import {Router} from 'express'
import { verAula, listarAulas, listarOficinas, verOficina, listarEventos,verEvento } from '../controllers/admin_controllers.js'
import { actualizarPasswordDocente, actualizarPerfilDocente, comprobarTokenPasswordDocente, crearNuevoPasswordDocente, loginDocente, perfilDocente, recuperarPasswordDocente, registroDocente } from '../controllers/docente_controllers.js'
import { verificarTokenJWT } from '../middlewares/JWT.js'
const routerDocentes = Router()

//REGISTRO Y AUTENTICACIÓN
routerDocentes.post('/docente/registro',registroDocente)
routerDocentes.post('/docente/recuperarpassword',recuperarPasswordDocente)      
routerDocentes.get('/docente/recuperarpassword/:token',comprobarTokenPasswordDocente) 
routerDocentes.post('/docente/nuevopassword/:token',crearNuevoPasswordDocente)
//AUTENTICACIÓN
routerDocentes.post('/docente/login',loginDocente) 
routerDocentes.get('/docente/perfil',verificarTokenJWT,perfilDocente)
routerDocentes.put('/docente/actualizarperfil/:id',verificarTokenJWT,actualizarPerfilDocente)
routerDocentes.put('/docente/actualizarpassword/:id',verificarTokenJWT,actualizarPasswordDocente)


//EVENTOS
routerDocentes.get('/eventos',listarEventos)
routerDocentes.get('/verevento/:id',verEvento)

//OFICINAS
routerDocentes.get('/oficinas',listarOficinas)
routerDocentes.get('/veroficina/:id',verOficina)
//AULAS
routerDocentes.get('/aulas',listarAulas)
routerDocentes.get('/veraula/:id',verAula)


export default routerDocentes