import { Types } from "mongoose"
import Tutoria from "../models/Tutorias.js"
import Inscripcion from "../models/Inscripcion.js"
import Estudiante from "../models/Estudiante.js"
import { successResponse, errorResponse } from "../helpers/response.js"
import {
  sendMailNotificationInscripcionDocente,
  sendMailNotificationInscripcionEstudianteAceptada,
  sendMailNotificationInscripcionEstudianteRechazada
} from "../helpers/sendMail.js"

export const listarTutorias = async (req, res) => {
  try {
    const tutorias = await Tutoria.find()
      .populate('docente', 'nombre apellido email telefono imagen')
      .sort({ created_at: -1 })
    return successResponse(res, tutorias)
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const listarTutoriasDocente = async (req, res) => {
  try {
    const docenteId = req.docenteHeader?._id
    if (!docenteId) {
      return errorResponse(res, "Solo un docente puede ver sus tutorías", 403)
    }
    const tutorias = await Tutoria.find({ docente: docenteId })
      .populate('docente', 'nombre apellido email telefono imagen')
      .sort({ created_at: -1 })
    return successResponse(res, tutorias)
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const verTutoria = async (req, res) => {
  try {
    const { id } = req.params
    const tutoria = await Tutoria.findById(id)
      .populate('docente', 'nombre apellido email telefono imagen')
    if (!tutoria) {
      return errorResponse(res, "La tutoría no existe", 404)
    }
    return successResponse(res, tutoria)
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const crearTutoria = async (req, res) => {
  try {
    const { titulo, docente, oficina, informacion, horarios, fecha, duracion, cupo_maximo, creado_por, estado } = req.body
    if (!docente || !oficina || !informacion || !horarios) {
      return errorResponse(res, "Lo sentimos, debes llenar docente, oficina, informacion y horarios", 400)
    }

    const nuevaTutoria = new Tutoria({ titulo, docente, oficina, informacion, horarios, fecha, duracion, cupo_maximo, creado_por, estado })
    await nuevaTutoria.save()

    const tutoriaPoblada = await Tutoria.findById(nuevaTutoria._id)
      .populate('docente', 'nombre apellido email telefono imagen')

    return successResponse(res, tutoriaPoblada, "Tutoría creada correctamente", 201)
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const actualizarTutoria = async (req, res) => {
  try {
    const { id } = req.params
    const { titulo, docente, oficina, informacion, horarios, fecha, duracion, cupo_maximo, creado_por, estado } = req.body

    const tutoria = await Tutoria.findById(id)
    if (!tutoria) {
      return errorResponse(res, "La tutoría no existe", 404)
    }

    if (titulo !== undefined) tutoria.titulo = titulo
    if (docente !== undefined) tutoria.docente = docente
    if (oficina !== undefined) tutoria.oficina = oficina
    if (informacion !== undefined) tutoria.informacion = informacion
    if (horarios !== undefined) tutoria.horarios = horarios
    if (fecha !== undefined) tutoria.fecha = fecha
    if (duracion !== undefined) tutoria.duracion = duracion
    if (cupo_maximo !== undefined) tutoria.cupo_maximo = cupo_maximo
    if (creado_por !== undefined) tutoria.creado_por = creado_por
    if (estado !== undefined) tutoria.estado = estado

    await tutoria.save()

    const tutoriaPoblada = await Tutoria.findById(tutoria._id)
      .populate('docente', 'nombre apellido email telefono imagen')

    return successResponse(res, tutoriaPoblada, "Tutoría actualizada correctamente")
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const eliminarTutoria = async (req, res) => {
  try {
    const { id } = req.params
    const tutoria = await Tutoria.findById(id)
    if (!tutoria) {
      return errorResponse(res, "La tutoría no existe", 404)
    }
    await Inscripcion.deleteMany({ tutoria_id: id })
    await tutoria.deleteOne()
    return successResponse(res, null, "Tutoría eliminada correctamente")
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const actualizarTutoriaDocente = async (req, res) => {
  try {
    const { id } = req.params
    const docenteId = req.docenteHeader?._id
    if (!docenteId) {
      return errorResponse(res, "Solo un docente puede editar sus tutorías", 403)
    }

    const tutoria = await Tutoria.findById(id)
    if (!tutoria) {
      return errorResponse(res, "La tutoría no existe", 404)
    }
    if (tutoria.docente.toString() !== docenteId.toString()) {
      return errorResponse(res, "No eres el docente de esta tutoría", 403)
    }

    const { titulo, oficina, informacion, horarios, fecha, duracion, cupo_maximo } = req.body

    if (titulo !== undefined) tutoria.titulo = titulo
    if (oficina !== undefined) tutoria.oficina = oficina
    if (informacion !== undefined) tutoria.informacion = informacion
    if (horarios !== undefined) tutoria.horarios = horarios
    if (fecha !== undefined) tutoria.fecha = fecha
    if (duracion !== undefined) tutoria.duracion = duracion
    if (cupo_maximo !== undefined) tutoria.cupo_maximo = cupo_maximo

    await tutoria.save()

    const tutoriaPoblada = await Tutoria.findById(tutoria._id)
      .populate('docente', 'nombre apellido email telefono imagen')

    return successResponse(res, tutoriaPoblada, "Tutoría actualizada correctamente")
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const cancelarTutoriaDocente = async (req, res) => {
  try {
    const { id } = req.params
    const docenteId = req.docenteHeader?._id
    if (!docenteId) {
      return errorResponse(res, "Solo un docente puede cancelar sus tutorías", 403)
    }

    const tutoria = await Tutoria.findById(id)
    if (!tutoria) {
      return errorResponse(res, "La tutoría no existe", 404)
    }
    if (tutoria.docente.toString() !== docenteId.toString()) {
      return errorResponse(res, "No eres el docente de esta tutoría", 403)
    }

    tutoria.estado = 'inactivo'
    await tutoria.save()

    return successResponse(res, null, "Tutoría cancelada correctamente")
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const eliminarTutoriaDocente = async (req, res) => {
  try {
    const { id } = req.params
    const docenteId = req.docenteHeader?._id
    if (!docenteId) {
      return errorResponse(res, "Solo un docente puede eliminar sus tutorías", 403)
    }

    const tutoria = await Tutoria.findById(id)
    if (!tutoria) {
      return errorResponse(res, "La tutoría no existe", 404)
    }
    if (tutoria.docente.toString() !== docenteId.toString()) {
      return errorResponse(res, "No eres el docente de esta tutoría", 403)
    }

    await Inscripcion.deleteMany({ tutoria_id: id })
    await tutoria.deleteOne()
    return successResponse(res, null, "Tutoría eliminada correctamente")
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const inscribirTutoria = async (req, res) => {
  try {
    const { id } = req.params
    const estudiante_id = req.body.estudiante_id || req.userHeader?._id

    if (!estudiante_id) {
      return errorResponse(res, "Debes proporcionar el ID del estudiante", 400)
    }

    const tutoria = await Tutoria.findById(id).populate('docente', 'nombre apellido email')
    if (!tutoria) {
      return errorResponse(res, "La tutoría no existe", 404)
    }

    if (tutoria.estado === 'inactivo') {
      return errorResponse(res, "La tutoría no está activa", 400)
    }

    const inscripcionExistente = await Inscripcion.findOne({ tutoria_id: id, estudiante_id })
    if (inscripcionExistente) {
      return errorResponse(res, "Ya estás inscrito en esta tutoría", 400)
    }

    if (tutoria.cupo_maximo) {
      const inscripcionesAceptadas = await Inscripcion.countDocuments({
        tutoria_id: id,
        estado: 'aceptado'
      })
      if (inscripcionesAceptadas >= tutoria.cupo_maximo) {
        return errorResponse(res, "La tutoría ha alcanzado el cupo máximo", 400)
      }
    }

    const estudiante = await Estudiante.findById(estudiante_id).select('nombre apellido email')
    if (!estudiante) {
      return errorResponse(res, "El estudiante no existe", 404)
    }

    const inscripcion = new Inscripcion({
      tutoria_id: id,
      estudiante_id,
      estado: 'pendiente'
    })
    await inscripcion.save()

    if (tutoria.docente?.email) {
      const nombreEstudiante = `${estudiante.nombre || ''} ${estudiante.apellido || ''}`.trim()
      sendMailNotificationInscripcionDocente(
        tutoria.docente.email,
        nombreEstudiante,
        tutoria.titulo,
        id
      ).catch(err => console.error("Error enviando notificación al docente:", err.message))
    }

    const inscripcionPoblada = await Inscripcion.findById(inscripcion._id)
      .populate('estudiante_id', 'nombre apellido email telefono imagen')

    return successResponse(res, inscripcionPoblada, "Inscripción realizada. Espera la confirmación del docente.", 201)
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const listarInscripciones = async (req, res) => {
  try {
    const { id } = req.params
    const tutoria = await Tutoria.findById(id)
    if (!tutoria) {
      return errorResponse(res, "La tutoría no existe", 404)
    }
    const inscripciones = await Inscripcion.find({ tutoria_id: id })
      .populate('estudiante_id', 'nombre apellido email telefono imagen')
      .sort({ created_at: -1 })
    return successResponse(res, inscripciones)
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const desinscribirTutoria = async (req, res) => {
  try {
    const { id } = req.params
    const estudiante_id = req.body.estudiante_id || req.userHeader?._id

    if (!estudiante_id) {
      return errorResponse(res, "Debes proporcionar el ID del estudiante", 400)
    }

    if (!Types.ObjectId.isValid(id)) {
      return errorResponse(res, "ID de tutoría inválido", 400)
    }
    if (!Types.ObjectId.isValid(estudiante_id)) {
      return errorResponse(res, "ID de estudiante inválido", 400)
    }

    const inscripcion = await Inscripcion.findOne({ tutoria_id: id, estudiante_id })
    if (!inscripcion) {
      return errorResponse(res, "No estás inscrito en esta tutoría", 404)
    }

    if (inscripcion.estado === 'aceptado') {
      const tutoria = await Tutoria.findById(id)
      if (tutoria && tutoria.estado === 'completo') {
        tutoria.estado = 'activo'
        await tutoria.save()
      }
    }

    await Inscripcion.deleteOne({ _id: inscripcion._id })
    return successResponse(res, null, "Inscripción cancelada correctamente")
  } catch (error) {
    if (error.name === 'CastError') {
      return errorResponse(res, "ID inválido", 400)
    }
    return errorResponse(res, error.message)
  }
}

export const aceptarInscripcion = async (req, res) => {
  try {
    const { id, inscripcionId } = req.params
    const docenteId = req.docenteHeader?._id

    if (!docenteId) {
      return errorResponse(res, "Solo un docente puede aceptar inscripciones", 403)
    }

    const tutoria = await Tutoria.findById(id).populate('docente', 'nombre apellido email')
    if (!tutoria) {
      return errorResponse(res, "La tutoría no existe", 404)
    }

    if (tutoria.docente._id.toString() !== docenteId.toString()) {
      return errorResponse(res, "No eres el docente de esta tutoría", 403)
    }

    const inscripcion = await Inscripcion.findById(inscripcionId)
      .populate('estudiante_id', 'nombre apellido email')
    if (!inscripcion) {
      return errorResponse(res, "La inscripción no existe", 404)
    }

    if (inscripcion.tutoria_id.toString() !== id) {
      return errorResponse(res, "La inscripción no pertenece a esta tutoría", 400)
    }

    if (inscripcion.estado !== 'pendiente') {
      return errorResponse(res, `La inscripción ya fue ${inscripcion.estado}`, 400)
    }

    if (tutoria.cupo_maximo) {
      const inscripcionesAceptadas = await Inscripcion.countDocuments({
        tutoria_id: id,
        estado: 'aceptado'
      })
      if (inscripcionesAceptadas >= tutoria.cupo_maximo) {
        return errorResponse(res, "La tutoría ha alcanzado el cupo máximo", 400)
      }
    }

    inscripcion.estado = 'aceptado'
    await inscripcion.save()

    if (tutoria.cupo_maximo) {
      const inscripcionesAceptadas = await Inscripcion.countDocuments({
        tutoria_id: id,
        estado: 'aceptado'
      })
      if (inscripcionesAceptadas >= tutoria.cupo_maximo) {
        tutoria.estado = 'completo'
        await tutoria.save()
      }
    }

    if (inscripcion.estudiante_id?.email) {
      const nombreEstudiante = `${inscripcion.estudiante_id.nombre || ''} ${inscripcion.estudiante_id.apellido || ''}`.trim()
      sendMailNotificationInscripcionEstudianteAceptada(
        inscripcion.estudiante_id.email,
        nombreEstudiante,
        tutoria.titulo
      ).catch(err => console.error("Error enviando notificación al estudiante:", err.message))
    }

    const inscripcionPoblada = await Inscripcion.findById(inscripcion._id)
      .populate('estudiante_id', 'nombre apellido email telefono imagen')

    return successResponse(res, inscripcionPoblada, "Inscripción aceptada correctamente")
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const rechazarInscripcion = async (req, res) => {
  try {
    const { id, inscripcionId } = req.params
    const docenteId = req.docenteHeader?._id

    if (!docenteId) {
      return errorResponse(res, "Solo un docente puede rechazar inscripciones", 403)
    }

    const tutoria = await Tutoria.findById(id).populate('docente', 'nombre apellido email')
    if (!tutoria) {
      return errorResponse(res, "La tutoría no existe", 404)
    }

    if (tutoria.docente._id.toString() !== docenteId.toString()) {
      return errorResponse(res, "No eres el docente de esta tutoría", 403)
    }

    const inscripcion = await Inscripcion.findById(inscripcionId)
      .populate('estudiante_id', 'nombre apellido email')
    if (!inscripcion) {
      return errorResponse(res, "La inscripción no existe", 404)
    }

    if (inscripcion.tutoria_id.toString() !== id) {
      return errorResponse(res, "La inscripción no pertenece a esta tutoría", 400)
    }

    if (inscripcion.estado !== 'pendiente') {
      return errorResponse(res, `La inscripción ya fue ${inscripcion.estado}`, 400)
    }

    inscripcion.estado = 'rechazado'
    await inscripcion.save()

    if (inscripcion.estudiante_id?.email) {
      const nombreEstudiante = `${inscripcion.estudiante_id.nombre || ''} ${inscripcion.estudiante_id.apellido || ''}`.trim()
      sendMailNotificationInscripcionEstudianteRechazada(
        inscripcion.estudiante_id.email,
        nombreEstudiante,
        tutoria.titulo
      ).catch(err => console.error("Error enviando notificación al estudiante:", err.message))
    }

    const inscripcionPoblada = await Inscripcion.findById(inscripcion._id)
      .populate('estudiante_id', 'nombre apellido email telefono imagen')

    return successResponse(res, inscripcionPoblada, "Inscripción rechazada correctamente")
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const listarInscripcionesDocente = async (req, res) => {
  try {
    const docenteId = req.docenteHeader?._id
    if (!docenteId) {
      return errorResponse(res, "Solo un docente puede ver sus inscripciones", 403)
    }

    const tutorias = await Tutoria.find({ docente: docenteId }).select('_id titulo')
    const tutoriaIds = tutorias.map(t => t._id)

    if (tutoriaIds.length === 0) {
      return successResponse(res, [])
    }

    const inscripciones = await Inscripcion.find({ tutoria_id: { $in: tutoriaIds } })
      .populate('estudiante_id', 'nombre apellido email telefono imagen')
      .populate('tutoria_id', 'titulo horarios informacion oficina')
      .sort({ created_at: -1 })

    return successResponse(res, inscripciones)
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const listarInscripcionesEstudiante = async (req, res) => {
  try {
    const estudianteId = req.userHeader?._id
    if (!estudianteId) {
      return errorResponse(res, "Solo un estudiante puede ver sus inscripciones", 403)
    }

    const inscripciones = await Inscripcion.find({ estudiante_id: estudianteId })
      .populate({
        path: 'tutoria_id',
        populate: { path: 'docente', select: 'nombre apellido email telefono imagen' }
      })
      .sort({ created_at: -1 })

    return successResponse(res, inscripciones)
  } catch (error) {
    return errorResponse(res, error.message)
  }
}
