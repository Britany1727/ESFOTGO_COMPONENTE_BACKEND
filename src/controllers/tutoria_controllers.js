import Tutoria from "../models/Tutorias.js"
import Inscripcion from "../models/Inscripcion.js"
import Estudiante from "../models/Estudiante.js"
import { successResponse, errorResponse } from "../helpers/response.js"

export const listarTutorias = async (req, res) => {
  try {
    const tutorias = await Tutoria.find().sort({ created_at: -1 })
    return successResponse(res, tutorias)
  } catch (error) {
    return errorResponse(res, error.message)
  }
}

export const verTutoria = async (req, res) => {
  try {
    const { id } = req.params
    const tutoria = await Tutoria.findById(id)
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
    return successResponse(res, nuevaTutoria, "Tutoría creada correctamente", 201)
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
    return successResponse(res, tutoria, "Tutoría actualizada correctamente")
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

export const inscribirTutoria = async (req, res) => {
  try {
    const { id } = req.params
    const estudiante_id = req.body.estudiante_id || req.userHeader?._id

    if (!estudiante_id) {
      return errorResponse(res, "Debes proporcionar el ID del estudiante", 400)
    }

    const tutoria = await Tutoria.findById(id)
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

    const inscripcion = new Inscripcion({ tutoria_id: id, estudiante_id })
    await inscripcion.save()
    return successResponse(res, inscripcion, "Inscripción exitosa", 201)
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

    const inscripcion = await Inscripcion.findOne({ tutoria_id: id, estudiante_id })
    if (!inscripcion) {
      return errorResponse(res, "No estás inscrito en esta tutoría", 404)
    }

    await inscripcion.deleteOne()
    return successResponse(res, null, "Inscripción cancelada correctamente")
  } catch (error) {
    return errorResponse(res, error.message)
  }
}
