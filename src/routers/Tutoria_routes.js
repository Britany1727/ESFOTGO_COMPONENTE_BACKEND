import { Router } from 'express'
import { verificarTokenJWT } from '../middlewares/JWT.js'
import {
  listarTutorias,
  listarTutoriasDocente,
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
  listarInscripcionesEstudiante,
  actualizarTutoriaDocente,
  cancelarTutoriaDocente,
  eliminarTutoriaDocente
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

routerTutoria.get('/docente/tutorias', verificarTokenJWT, listarTutoriasDocente)
routerTutoria.put('/docente/tutoria/:id', verificarTokenJWT, actualizarTutoriaDocente)
routerTutoria.patch('/docente/tutoria/:id/cancelar', verificarTokenJWT, cancelarTutoriaDocente)
routerTutoria.delete('/docente/tutoria/:id', verificarTokenJWT, eliminarTutoriaDocente)
routerTutoria.get('/docente/tutorias/inscripciones', verificarTokenJWT, listarInscripcionesDocente)
routerTutoria.put('/docente/tutoria/:id/inscripcion/:inscripcionId/aceptar', verificarTokenJWT, aceptarInscripcion)
routerTutoria.put('/docente/tutoria/:id/inscripcion/:inscripcionId/rechazar', verificarTokenJWT, rechazarInscripcion)

routerTutoria.get('/estudiante/tutorias/inscripciones', verificarTokenJWT, listarInscripcionesEstudiante)
routerTutoria.delete('/estudiante/tutoria/:id/inscribir', verificarTokenJWT, desinscribirTutoria)

export default routerTutoria
