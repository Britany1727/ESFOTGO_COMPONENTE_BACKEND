import { Router } from 'express'
import { verificarTokenJWT } from '../middlewares/JWT.js'
import {
  listarTutorias,
  verTutoria,
  crearTutoria,
  actualizarTutoria,
  eliminarTutoria,
  listarInscripciones,
  inscribirTutoria,
  desinscribirTutoria,
  aceptarInscripcion,
  rechazarInscripcion,
  listarInscripcionesDocente,
  listarInscripcionesEstudiante
} from '../controllers/tutoria_controllers.js'

const routerTutoria = Router()

routerTutoria.get('/admin/tutorias', verificarTokenJWT, listarTutorias)
routerTutoria.get('/admin/tutorias/:id', verificarTokenJWT, verTutoria)
routerTutoria.post('/admin/tutoria', verificarTokenJWT, crearTutoria)
routerTutoria.put('/admin/tutoria/:id', verificarTokenJWT, actualizarTutoria)
routerTutoria.delete('/admin/tutoria/:id', verificarTokenJWT, eliminarTutoria)
routerTutoria.get('/admin/tutoria/:id/inscripciones', verificarTokenJWT, listarInscripciones)
routerTutoria.post('/admin/tutoria/:id/inscribir', verificarTokenJWT, inscribirTutoria)
routerTutoria.delete('/admin/tutoria/:id/inscribir', verificarTokenJWT, desinscribirTutoria)

routerTutoria.get('/docente/tutorias/inscripciones', verificarTokenJWT, listarInscripcionesDocente)
routerTutoria.put('/docente/tutoria/:id/inscripcion/:inscripcionId/aceptar', verificarTokenJWT, aceptarInscripcion)
routerTutoria.put('/docente/tutoria/:id/inscripcion/:inscripcionId/rechazar', verificarTokenJWT, rechazarInscripcion)

routerTutoria.get('/estudiante/tutorias/inscripciones', verificarTokenJWT, listarInscripcionesEstudiante)

export default routerTutoria
