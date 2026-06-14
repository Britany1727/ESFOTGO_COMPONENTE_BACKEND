import { Router } from 'express'
import { verificarTokenJWT } from '../middlewares/JWT.js'
import {
  listarTutorias,
  verTutoria,
  crearTutoria,
  actualizarTutoria,
  eliminarTutoria,
  inscribirTutoria,
  desinscribirTutoria
} from '../controllers/tutoria_controllers.js'

const routerTutoria = Router()

routerTutoria.get('/admin/tutorias', verificarTokenJWT, listarTutorias)
routerTutoria.get('/admin/tutorias/:id', verificarTokenJWT, verTutoria)
routerTutoria.post('/admin/tutoria', verificarTokenJWT, crearTutoria)
routerTutoria.put('/admin/tutoria/:id', verificarTokenJWT, actualizarTutoria)
routerTutoria.delete('/admin/tutoria/:id', verificarTokenJWT, eliminarTutoria)
routerTutoria.post('/admin/tutoria/:id/inscribir', verificarTokenJWT, inscribirTutoria)
routerTutoria.delete('/admin/tutoria/:id/inscribir', verificarTokenJWT, desinscribirTutoria)

export default routerTutoria
